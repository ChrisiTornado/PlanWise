import { Injectable } from '@angular/core';
import {finalize, map, Observable, tap} from "rxjs";
import {EProjectState, Project} from "../models/project.model";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {ProjectExpense} from "../models/project-expense.model";
import {ProjectLecturer} from "../models/project-lecturer.model";
import {Faculty} from "../models/faculty.model";
import {OtherExpense} from "../models/other-expense.model";
import {ProjectType} from "../models/project-type.model";
import {AResourceService} from "./a-resource.service";
import {finalizeLoading} from "../shared/operators/finalize-loading.operator";
import { Company } from '../models/company.model';
import { GroupSpecificExpense } from '../models/group-specific-expense.model';


@Injectable({
  providedIn: 'root'
})
export class ProjectService extends AResourceService<Project> {
  public filteredProjects$(
    projectType: ProjectType,
    faculty: Faculty,
    company: Company,
    dateFrom: Date, // Startdatum ab
    dateUntil: Date, // Startdatum bis
    dateCreatedFrom: Date, // Erstelldatum ab
    dateCreatedUntil: Date // Erstelldatum bis
  ): Observable<Project[]> {
    return this._models.asObservable().pipe(
      map(projects =>
        (projects ?? []).filter((project) => {
          const matchesProjectType = projectType == null || project.projectType.id === projectType.id;
          const matchesFaculty = faculty == null || project.faculty.id === faculty.id;
          const matchesCompany = company == null || project.company.id === company.id;

          // Entferne den Zeitanteil vom Datum für Vergleich
          const projectStartDate = new Date(new Date(project.start).toDateString());
          const fromDate = dateFrom ? new Date(dateFrom.toDateString()) : null;
          const untilDate = dateUntil ? new Date(dateUntil.toDateString()) : null;

          const matchesStartDateFrom = fromDate == null || projectStartDate >= fromDate;
          const matchesStartDateUntil = untilDate == null || projectStartDate <= untilDate;

          // Entferne den Zeitanteil vom Datum für Vergleich
          const projectCreatedDate = new Date(new Date(project.createdAt).toDateString());
          const fromCreatedDate = dateCreatedFrom ? new Date(dateCreatedFrom.toDateString()) : null;
          const untilCreatedDate = dateCreatedUntil ? new Date(dateCreatedUntil.toDateString()) : null;

          const matchesCreatedDateFrom = fromCreatedDate == null || projectCreatedDate >= fromCreatedDate;
          const matchesCreatedDateUntil = untilCreatedDate == null || projectCreatedDate <= untilCreatedDate;

          return matchesProjectType && matchesFaculty && matchesCompany && matchesStartDateFrom && matchesStartDateUntil && matchesCreatedDateFrom && matchesCreatedDateUntil;
        })
      )
    );
  }

  constructor(private http: HttpClient) {
    super('projects')
  }

  override getAll(): void {
    if (!this.models?.length) this._loading.next(true)
    this.http.get<Project[]>(environment.adminApiUrl + `projects`)
      .pipe(finalizeLoading(this._loading, false))
      .subscribe(projects => this.models = projects)
  }

  getAllByFaculty(facultyId: number): void {
    if (!this.models?.length) this._loading.next(true)
    this.http.get<Project[]>(environment.apiUrl + `faculties/${facultyId}/projects`)
      .pipe(finalizeLoading(this._loading, false))
      .subscribe(projects => this.models = projects);
  }

  getOne(id: number, facultyId: number): Observable<Project> {
    return this.http.get<Project>(environment.apiUrl + `faculties/${facultyId}/projects/${id}`);
  }

  getOneAdmin(id: number): Observable<Project> {
    return this.http.get<Project>(environment.adminApiUrl + `projects/${id}`);
  }

  create(
    facultyId: number,
    projectTypeId: number,
    companyId: number,
    name: string,
    start: string,
    end: string,
    firstname: string,
    lastname: string,
    email: string,
    crossFaculty: boolean,
    notes: string,
    expenses: ProjectExpense[],
    lecturers: ProjectLecturer[],
    costs: number,
    participants: number,
    duration: number,
    ects: number,
    crossFaculties: Faculty[]
  ): Observable<Project> {
    return this.http.post<Project>(
      environment.apiUrl + `faculties/${facultyId}/projects`,
      {
        projectTypeId,
        companyId,
        name,
        start,
        end,
        firstname,
        lastname,
        email,
        crossFaculty,
        notes,
        expenses: this.deduplicateExpenses(expenses).map(e =>({id: e.expense.id, costs: e.costs * 100})),
        lecturers: lecturers.map(l =>({id: l.lecturer.id, hours: l.hours, daily: l.daily})),
        costs,
        participants,
        duration,
        ects,
        crossFaculties: crossFaculties.map(c => ({id: c.id}))
      })
      .pipe(
        tap((model) => {
          this.addModel(model);
        }),
      )
  }

  update(
    projectId: number,
    facultyId: number,
    projectTypeId: number,
    companyId: number,
    name: string,
    start: string,
    end: string,
    firstname: string,
    lastname: string,
    email: string,
    crossFaculty: boolean,
    notes: string,
    expenses: ProjectExpense[],
    lecturers: ProjectLecturer[],
    costs: number,
    participants: number,
    duration: number,
    ects: number,
    crossFaculties: Faculty[],
    priceForCoursePerDayOverride: number | null,
    otherExpenses: OtherExpense[],
    groupSpecificExpenses: GroupSpecificExpense[]
  ): Observable<Project> {

    return this.http.put<Project>(
      environment.apiUrl + `faculties/${facultyId}/projects/${projectId}`,
      {
        projectId,
        facultyId,
        projectTypeId,
        companyId,
        name,
        start,
        end,
        firstname,
        lastname,
        email,
        crossFaculty,
        notes,
        expenses: this.deduplicateExpenses(expenses).map(e =>({id: e.expense.id, costs: e.costs * 100})),
        lecturers: lecturers.map(l =>({id: l.lecturer.id, hours: l.hours, daily: l.daily, hourlyRateOverride: l.hourlyRateOverride ? l.hourlyRateOverride * 100 : null, dailyRateOverride: l.dailyRateOverride ? l.dailyRateOverride * 100 : null})),
        costs,
        participants,
        duration,
        ects,
        crossFaculties: crossFaculties.map(c => ({id: c.id})),
        priceForCoursePerDayOverride: priceForCoursePerDayOverride * 100,
        otherExpenses: otherExpenses.map(oe =>({id: oe.id, name: oe.name, perParticipant: oe.perParticipant, costs: oe.costs * 100})),
        groupSpecificExpenses: groupSpecificExpenses.map(ge =>({id: ge.id, name: ge.name, perParticipant: ge.perParticipant, costs: ge.costs * 100}))
      })
      .pipe(
        tap((model) => {
          this.updateModel(model);
        }),
      )
  }

  updateState(id: number, state: EProjectState) {
    return this.http.patch<Project>(environment.adminApiUrl + `projects/${id}/set-state`, {state})
      .pipe(
        tap((model) => {
          this.updateModel(model);
        }),
      )
  }

  exportToCSV(facultyId: number, project: Project): Observable<any> {
    return this.http.get(environment.apiUrl + `faculties/${facultyId}/projects/${project.id}/csv`);
  }

  exportToPDF(facultyId: number, project: Project): Observable<any> {
    return this.http.get(environment.apiUrl + `faculties/${facultyId}/projects/${project.id}/pdf`, {
      responseType: 'blob' // Important to set the response type to 'blob'
    });
  }

  reportExport(ids: number[]): Observable<any> {
    return this.http.get(environment.apiUrl + `projects/report?ids=${ids.join(',')}`);
  }

  getProjectsByCompanyId(id: number): void {
    this._loading.next(true)
    this.http.get<Project[]>(environment.adminApiUrl + `projects/fetch-companies/${id}`)
      .pipe(finalize(() => this._loading.next(false)))
      .subscribe(projects => this.models = projects);
  }

  getProjectsByFacultyId(id: number): void {
    this._loading.next(true)
    this.http.get<Project[]>(environment.adminApiUrl + `projects/fetch-faculties/${id}`)
      .pipe(finalize(() => this._loading.next(false)))
      .subscribe(projects => this.models = projects);
  }

  private deduplicateExpenses(expenses: ProjectExpense[]): ProjectExpense[] {
    return Array.from(
      new Map((expenses ?? []).map(expense => [expense.expense?.id, expense])).values()
    );
  }
}
