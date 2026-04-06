import csv
from datetime import date, datetime
from io import BytesIO, StringIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models import GroupSpecificExpense, OtherExpense, Project, ProjectLecturer, ProjectState


def project_csv_string(project: Project, is_admin: bool) -> str:
    output = StringIO()
    output.write("\ufeff")
    writer = csv.writer(output, delimiter=";", lineterminator="\r\n")

    is_course = project.project_type.is_course
    writer.writerow(_course_detail_keys(is_admin) if is_course else _detail_keys())
    writer.writerow(_course_detail_row(project, is_admin) if is_course else _detail_row(project))
    writer.writerow([])

    writer.writerow(["LECTURERS"])
    writer.writerow(_lecturer_keys(is_admin))
    for project_lecturer in project.lecturers:
        writer.writerow(_lecturer_row(project_lecturer, is_admin))
    writer.writerow([])

    writer.writerow(["EXPENSES"])
    writer.writerow(["EXPENSE", "COSTS"])
    for project_expense in project.expenses:
        writer.writerow([project_expense.expense.name, _eur(project_expense.costs)])
    writer.writerow([])

    if is_admin:
        writer.writerow(["OTHER EXPENSES"])
        writer.writerow(["EXPENSE", "PER_PARTICIPANT", "COSTS"])
        for other_expense in project.other_expenses:
            writer.writerow(_additional_expense_row(other_expense, project.participants or 1))
        writer.writerow([])

        writer.writerow(["GROUP SPECIFIC EXPENSES"])
        writer.writerow(["EXPENSE", "PER_PARTICIPANT", "COSTS"])
        for group_specific_expense in project.group_specific_expenses:
            writer.writerow(_additional_expense_row(group_specific_expense, project.participants or 1))

    return output.getvalue()


def projects_report_csv_string(projects: list[Project], is_admin: bool) -> str:
    output = StringIO()
    output.write("\ufeff")
    writer = csv.writer(output, delimiter=";", lineterminator="\r\n")

    writer.writerow(
        ["NAME", "COMPANY", "FACULTY", "TYPE", "CREATED AT", "START DATE", "END DATE", "COSTS", "STATE"]
        if is_admin
        else ["NAME", "COMPANY", "TYPE", "CREATED AT", "START DATE", "END DATE", "COSTS", "STATE"]
    )
    for project in projects:
        base_row = [
            project.name,
            project.company.name if project.company else "",
        ]
        if is_admin:
            base_row.append(project.faculty.name if project.faculty else "")
        writer.writerow(
            base_row
            + [
                project.project_type.name if project.project_type else "",
                _format_date(project.created_at),
                _format_date(project.start),
                _format_date(project.end),
                _eur(project.costs),
                _state_label(project.state),
            ]
        )

    return output.getvalue()


def project_pdf_bytes(project: Project, is_admin: bool) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=32, leftMargin=32, topMargin=32, bottomMargin=32)
    styles = getSampleStyleSheet()
    story = [Paragraph(project.name, styles["Title"]), Spacer(1, 12)]

    details = [
        ["Kunde", project.company.name],
        ["Typ", project.project_type.name],
        ["Ansprechperson", f"{project.firstname} {project.lastname} ({project.email})"],
        ["Fakultaet", project.faculty.name],
        ["Startdatum", _format_date(project.start)],
        ["Enddatum", _format_date(project.end)],
        ["Anmerkungen", project.notes or ""],
        ["Gesamtkosten", _money(project.costs)],
    ]
    if project.project_type.is_course:
        details.extend(
            [
                ["Teilnehmeranzahl", project.participants or ""],
                ["Dauer", f"{project.duration or ''} Tage"],
                ["ECTS", project.ects or ""],
            ]
        )
        if is_admin:
            price = project.price_for_course_per_day_override or project.faculty.price_for_course_per_day
            details.append(["Preis pro Teilnehmer und Tag", _money(price)])
    _add_table(story, "Details", details, styles)

    lecturer_rows = [["Name", "Fakultaet"]]
    if is_admin:
        lecturer_rows[0].extend(["Stundensatz", "Tagessatz"])
    lecturer_rows[0].extend(["Stunden", "Tage", "Kosten"])
    for project_lecturer in project.lecturers:
        row = [project_lecturer.lecturer.name, project_lecturer.lecturer.faculty.name]
        if is_admin:
            row.extend([
                _money(project_lecturer.hourly_rate_override or project_lecturer.lecturer.hourly_rate),
                _money(project_lecturer.daily_rate_override or project_lecturer.lecturer.daily_rate),
            ])
        row.extend([
            "" if project_lecturer.daily else project_lecturer.hours,
            project_lecturer.hours if project_lecturer.daily else "",
            _money(_project_lecturer_costs(project_lecturer) * 100),
        ])
        lecturer_rows.append(row)
    _add_table(story, "Vortragende", lecturer_rows, styles, has_header=True)

    expense_rows = [["Aufwand", "Kosten"]]
    expense_rows.extend([[expense.expense.name, _money(expense.costs)] for expense in project.expenses])
    _add_table(story, "Aufwaende", expense_rows, styles, has_header=True)

    if is_admin:
        _add_table(story, "Zusaetzliche Aufwaende", _additional_pdf_rows(project.other_expenses, project), styles, True)
        _add_table(
            story,
            "Projektgruppenspezifische Aufwaende",
            _additional_pdf_rows(project.group_specific_expenses, project),
            styles,
            True,
        )

    doc.build(story)
    return buffer.getvalue()


def _add_table(story: list, title: str, rows: list, styles, has_header: bool = False) -> None:
    story.append(Paragraph(title, styles["Heading2"]))
    if len(rows) == 1 and has_header:
        rows.append(["" for _ in rows[0]])
    table = Table(rows, hAlign="LEFT")
    style = [
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
    ]
    if not has_header:
        style.pop()
    table.setStyle(TableStyle(style))
    story.extend([table, Spacer(1, 12)])


def _additional_pdf_rows(expenses: list[OtherExpense] | list[GroupSpecificExpense], project: Project) -> list:
    rows = [["Name", "Pro Teilnehmer", "Kosten"]]
    for expense in expenses:
        rows.append([
            expense.name,
            "Ja" if expense.per_participant else "Nein",
            _money(expense.costs * (project.participants or 1) if expense.per_participant else expense.costs),
        ])
    return rows


def _course_detail_keys(is_admin: bool) -> list[str]:
    keys = [
        "ID",
        "COMPANY",
        "NAME",
        "FACULTY",
        "TYPE",
        "START",
        "END",
        "FIRSTNAME",
        "LASTNAME",
        "EMAIL",
        "CROSS_FACULTY",
        "TOTAL_COSTS",
        "NOTES",
        "DURATION",
        "CREATED_AT",
        "STATE",
        "PARTICIPANTS",
        "ECTS",
    ]
    if is_admin:
        keys.append("PRICE_PER_DAY")
    return keys


def _detail_keys() -> list[str]:
    return [
        "ID",
        "COMPANY",
        "NAME",
        "FACULTY",
        "TYPE",
        "START",
        "END",
        "FIRSTNAME",
        "LASTNAME",
        "EMAIL",
        "CROSS_FACULTY",
        "TOTAL_COSTS",
        "NOTES",
        "DURATION",
        "CREATED_AT",
        "STATE",
    ]


def _lecturer_keys(is_admin: bool) -> list[str]:
    keys = ["FACULTY", "LECTURER"]
    if is_admin:
        keys.extend(["HOURLY_RATE", "DAILY_RATE"])
    keys.extend(["HOURS", "DAYS", "COSTS"])
    return keys


def _course_detail_row(project: Project, is_admin: bool) -> list:
    row = [
        project.id,
        project.company.name,
        project.name,
        project.faculty.name,
        project.project_type.name,
        _format_date(project.start),
        _format_date(project.end),
        project.firstname,
        project.lastname,
        project.email,
        "Ja" if project.cross_faculty else "Nein",
        _eur(project.costs),
        project.notes,
        project.duration,
        _format_date(project.created_at),
        _state_label(project.state),
        project.participants,
        project.ects,
    ]
    if is_admin:
        row.append(_eur(project.price_for_course_per_day_override or project.faculty.price_for_course_per_day))
    return row


def _detail_row(project: Project) -> list:
    return [
        project.id,
        project.company.name,
        project.name,
        project.faculty.name,
        project.project_type.name,
        _format_date(project.start),
        _format_date(project.end),
        project.firstname,
        project.lastname,
        project.email,
        "Ja" if project.cross_faculty else "Nein",
        _eur(project.costs),
        project.notes,
        project.duration,
        _format_date(project.created_at),
        _state_label(project.state),
    ]


def _lecturer_row(project_lecturer: ProjectLecturer, is_admin: bool) -> list:
    row = [project_lecturer.lecturer.faculty.name, project_lecturer.lecturer.name]
    if is_admin:
        row.extend([
            _eur(project_lecturer.hourly_rate_override or project_lecturer.lecturer.hourly_rate),
            _eur(project_lecturer.daily_rate_override or project_lecturer.lecturer.daily_rate),
        ])
    row.extend([
        "" if project_lecturer.daily else project_lecturer.hours,
        project_lecturer.hours if project_lecturer.daily else "",
        _project_lecturer_costs(project_lecturer),
    ])
    return row


def _additional_expense_row(expense: OtherExpense | GroupSpecificExpense, participants: int) -> list:
    return [
        expense.name,
        "Ja" if expense.per_participant else "Nein",
        _eur(expense.costs * participants if expense.per_participant else expense.costs),
    ]


def _project_lecturer_costs(project_lecturer: ProjectLecturer) -> float:
    rate = (
        project_lecturer.daily_rate_override or project_lecturer.lecturer.daily_rate
        if project_lecturer.daily
        else project_lecturer.hourly_rate_override or project_lecturer.lecturer.hourly_rate
    )
    return _eur(project_lecturer.hours * rate)


def _eur(cents: int | None) -> float:
    return 0 if cents is None else cents / 100


def _money(cents: int | None) -> str:
    return f"{_eur(cents):.2f} EUR"


def _format_date(value: date | datetime | None) -> str:
    return value.strftime("%d.%m.%Y") if value else ""


def _state_label(value: str) -> str:
    match value:
        case ProjectState.SUBMITTED.value:
            return "Eingereicht"
        case ProjectState.APPROVED.value:
            return "Genehmigt"
        case ProjectState.REJECTED.value:
            return "Abgelehnt"
        case _:
            return value
