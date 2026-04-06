from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import (
    Company,
    Expense,
    Faculty,
    GroupSpecificExpense,
    Lecturer,
    Notification,
    OtherExpense,
    Project,
    ProjectExpense,
    ProjectFaculty,
    ProjectLecturer,
    ProjectState,
    ProjectType,
    Role,
    User,
)


def seed_startup_mock_data(db: Session) -> None:
    now = datetime.now()

    faculties = {
        name: Faculty(name=name, price_for_course_per_day=price)
        for name, price in [
            ("Informatik & Wirtschaft", 22000),
            ("Industrial Engineering", 21000),
            ("Life Science Engineering", 24000),
            ("Electronic Engineering", 20000),
        ]
    }
    db.add_all(faculties.values())
    db.flush()

    users = {
        email: User(
            email=email,
            password=hash_password("123456"),
            role=role.value,
            faculty=faculties[faculty_name] if faculty_name else None,
            email_verified_at=now,
            password_reset=True,
        )
        for email, role, faculty_name in [
            ("admin@technikum-wien.at", Role.ADMIN, None),
            ("informatik@technikum-wien.at", Role.FACULTY, "Informatik & Wirtschaft"),
            ("industrial-engineering@technikum-wien.at", Role.FACULTY, "Industrial Engineering"),
            ("life-science@technikum-wien.at", Role.FACULTY, "Life Science Engineering"),
            ("electronic-engineering@technikum-wien.at", Role.FACULTY, "Electronic Engineering"),
        ]
    }
    db.add_all(users.values())
    db.flush()

    lecturers = {
        name: Lecturer(name=name, hourly_rate=hourly_rate, daily_rate=daily_rate, faculty=faculties[faculty_name])
        for name, hourly_rate, daily_rate, faculty_name in [
            ("Dr. Anna Berger", 7500, 56000, "Informatik & Wirtschaft"),
            ("DI Markus Steiner", 6800, 52000, "Informatik & Wirtschaft"),
            ("Prof. Eva Schmid", 7200, 54000, "Industrial Engineering"),
            ("Dr. Lukas Weber", 6400, 50000, "Industrial Engineering"),
            ("DI Nora Fischer", 7000, 54000, "Life Science Engineering"),
            ("Dr. Paul Gruber", 6600, 51000, "Electronic Engineering"),
        ]
    }
    db.add_all(lecturers.values())
    db.flush()

    expenses = {name: Expense(name=name) for name in [
        "Reiseaufwand",
        "Bewirtung",
        "Marketing und Werbung",
        "Software-Lizenzen",
        "Laborverbrauchsmaterial",
        "Externe Beratung",
    ]}
    db.add_all(expenses.values())
    db.flush()

    project_types = {
        name: ProjectType(name=name, code=code, is_course=is_course)
        for name, code, is_course in [
            ("Lehrgänge", "LG", True),
            ("Seminare", "SE", True),
            ("Internes Projekt", "IP", False),
            ("Förderprojekte", "FP", False),
            ("Industrieprojekt", "IND", False),
        ]
    }
    db.add_all(project_types.values())
    db.flush()

    companies = {
        name: Company(name=name, image_path=image_path)
        for name, image_path in [
            ("FH-Technikum", "company_images/fh-technikum.png"),
            ("IBM", "company_images/ibm.png"),
            ("Stadt Wien", "company_images/stadt-wien.png"),
            ("Fabasoft", "company_images/fabasoft.png"),
            ("Accenture", "company_images/accenture.png"),
            ("SAP", "company_images/sap.png"),
            ("Erste Bank", "company_images/erste-bank.png"),
            ("Paysafe", "company_images/paysafe.png"),
            ("Asfinag", "company_images/asfinag.png"),
        ]
    }
    db.add_all(companies.values())

    project_categories = [
        "Beratung",
        "Entwicklung",
        "Forschung",
        "Schulung",
        "Analyse",
    ]
    db.add_all([
        Notification(email="admin@technikum-wien.at", activated=True),
        Notification(email="controlling@technikum-wien.at", activated=True),
        Notification(email="projektkoordination@technikum-wien.at", activated=False),
    ])
    db.flush()

    # Project categories currently have standalone CRUD only and no active project relation.
    from app.models import ProjectCategory

    db.add_all([ProjectCategory(name=name) for name in project_categories])
    db.flush()

    project_specs = [
        {
            "name": "Data Analytics Bootcamp",
            "project_type": "Seminare",
            "company": "IBM",
            "faculty": "Informatik & Wirtschaft",
            "cross_faculties": ["Industrial Engineering"],
            "user": "informatik@technikum-wien.at",
            "participants": 18,
            "duration": 4,
            "ects": 3,
            "price_for_course_per_day_override": 24000,
            "state": ProjectState.APPROVED,
            "is_opened": True,
            "lecturers": [
                {"name": "Dr. Anna Berger", "hours": 4, "daily": True},
                {"name": "DI Markus Steiner", "hours": 10, "daily": False},
            ],
            "expenses": [
                {"name": "Software-Lizenzen", "costs": 160000},
                {"name": "Bewirtung", "costs": 90000},
            ],
            "other_expenses": [
                {"name": "Seminarunterlagen", "costs": 1800, "per_participant": True},
                {"name": "Raumtechnik", "costs": 45000, "per_participant": False},
            ],
            "group_specific_expenses": [
                {"name": "Cloud-Lab Umgebung", "costs": 2200, "per_participant": True},
            ],
        },
        {
            "name": "Smart City IoT Pilot",
            "project_type": "Industrieprojekt",
            "company": "Stadt Wien",
            "faculty": "Electronic Engineering",
            "user": "electronic-engineering@technikum-wien.at",
            "participants": None,
            "duration": None,
            "ects": None,
            "state": ProjectState.SUBMITTED,
            "is_opened": False,
            "lecturers": [{"name": "Dr. Paul Gruber", "hours": 38, "daily": False}],
            "expenses": [
                {"name": "Laborverbrauchsmaterial", "costs": 240000},
                {"name": "Reiseaufwand", "costs": 60000},
            ],
            "other_expenses": [{"name": "Sensor-Prototypen", "costs": 180000, "per_participant": False}],
            "group_specific_expenses": [],
        },
        {
            "name": "Lean Production Workshop",
            "project_type": "Seminare",
            "company": "Asfinag",
            "faculty": "Industrial Engineering",
            "user": "industrial-engineering@technikum-wien.at",
            "participants": 8,
            "duration": 3,
            "ects": 2,
            "price_for_course_per_day_override": 19000,
            "state": ProjectState.SUBMITTED,
            "is_opened": False,
            "lecturers": [
                {"name": "Prof. Eva Schmid", "hours": 3, "daily": True},
                {"name": "Dr. Lukas Weber", "hours": 8, "daily": False},
            ],
            "expenses": [
                {"name": "Bewirtung", "costs": 70000},
                {"name": "Reiseaufwand", "costs": 50000},
            ],
            "other_expenses": [{"name": "Planspielmaterial", "costs": 1200, "per_participant": True}],
            "group_specific_expenses": [{"name": "Workshop-Setup", "costs": 90000, "per_participant": False}],
        },
        {
            "name": "Regulatory Affairs Grundlagen",
            "project_type": "Lehrgänge",
            "company": "Accenture",
            "faculty": "Life Science Engineering",
            "user": "life-science@technikum-wien.at",
            "participants": 12,
            "duration": 5,
            "ects": 4,
            "price_for_course_per_day_override": 23000,
            "state": ProjectState.REJECTED,
            "is_opened": True,
            "lecturers": [{"name": "DI Nora Fischer", "hours": 5, "daily": True}],
            "expenses": [
                {"name": "Externe Beratung", "costs": 180000},
                {"name": "Marketing und Werbung", "costs": 60000},
            ],
            "other_expenses": [{"name": "Zertifikatsunterlagen", "costs": 2500, "per_participant": True}],
            "group_specific_expenses": [],
        },
        {
            "name": "Payment Security Review",
            "project_type": "Industrieprojekt",
            "company": "Paysafe",
            "faculty": "Informatik & Wirtschaft",
            "user": "informatik@technikum-wien.at",
            "participants": None,
            "duration": None,
            "ects": None,
            "state": ProjectState.APPROVED,
            "is_opened": True,
            "lecturers": [
                {"name": "Dr. Anna Berger", "hours": 24, "daily": False},
                {"name": "DI Markus Steiner", "hours": 18, "daily": False},
            ],
            "expenses": [{"name": "Software-Lizenzen", "costs": 90000}],
            "other_expenses": [{"name": "Penetration-Test Umgebung", "costs": 120000, "per_participant": False}],
            "group_specific_expenses": [],
        },
        {
            "name": "ERP Integration Prototype",
            "project_type": "Förderprojekte",
            "company": "SAP",
            "faculty": "Informatik & Wirtschaft",
            "user": "informatik@technikum-wien.at",
            "participants": None,
            "duration": None,
            "ects": None,
            "state": ProjectState.SUBMITTED,
            "is_opened": False,
            "lecturers": [{"name": "DI Markus Steiner", "hours": 32, "daily": False}],
            "expenses": [
                {"name": "Software-Lizenzen", "costs": 210000},
                {"name": "Externe Beratung", "costs": 140000},
            ],
            "other_expenses": [],
            "group_specific_expenses": [],
        },
    ]

    for index, spec in enumerate(project_specs):
        start = date.today() + timedelta(weeks=index + 1)
        duration_days = spec["duration"] or 14
        project = Project(
            name=spec["name"],
            costs=_calculate_project_costs(spec, lecturers),
            project_type=project_types[spec["project_type"]],
            company=companies[spec["company"]],
            user=users[spec["user"]],
            faculty=faculties[spec["faculty"]],
            firstname="Max",
            lastname="Mustermann",
            email=f"kontakt+{spec['name'].lower().replace(' ', '-')}@example.com",
            start=start,
            end=start + timedelta(days=duration_days),
            cross_faculty=bool(spec.get("cross_faculties")),
            notes="Automatisch erstellter Mock-Datensatz für Entwicklung und Demo.",
            participants=spec["participants"],
            duration=spec["duration"],
            ects=spec["ects"],
            is_opened=spec["is_opened"],
            price_for_course_per_day_override=spec.get("price_for_course_per_day_override") if spec["participants"] else None,
            state=spec["state"].value,
            state_changed_at=now,
        )
        db.add(project)
        db.flush()

        db.add_all([
            ProjectLecturer(
                project=project,
                lecturer=lecturers[item["name"]],
                hours=item["hours"],
                daily=item["daily"],
            )
            for item in spec["lecturers"]
        ])
        db.add_all([
            ProjectExpense(project=project, expense=expenses[item["name"]], costs=item["costs"])
            for item in spec["expenses"]
        ])
        db.add_all([
            ProjectFaculty(project=project, faculty=faculties[faculty_name])
            for faculty_name in spec.get("cross_faculties", [])
        ])
        db.add_all([
            OtherExpense(
                project=project,
                name=item["name"],
                costs=item["costs"],
                per_participant=item["per_participant"],
            )
            for item in spec["other_expenses"]
        ])
        db.add_all([
            GroupSpecificExpense(
                project=project,
                name=item["name"],
                costs=item["costs"],
                per_participant=item["per_participant"],
            )
            for item in spec["group_specific_expenses"]
        ])

    db.commit()


def _calculate_project_costs(spec: dict, lecturers: dict[str, Lecturer]) -> int:
    participants = spec["participants"] or 0
    lecturer_costs = sum(
        item["hours"] * (lecturers[item["name"]].daily_rate if item["daily"] else lecturers[item["name"]].hourly_rate)
        for item in spec["lecturers"]
    )
    expense_costs = sum(item["costs"] for item in spec["expenses"])
    other_costs = sum(
        item["costs"] * participants if item["per_participant"] else item["costs"]
        for item in spec["other_expenses"]
    )
    group_specific_costs = sum(
        item["costs"] * participants if item["per_participant"] else item["costs"]
        for item in spec["group_specific_expenses"]
    )
    return lecturer_costs + expense_costs + other_costs + group_specific_costs
