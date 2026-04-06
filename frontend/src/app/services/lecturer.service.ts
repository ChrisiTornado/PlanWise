import { Injectable } from '@angular/core';
import {BehaviorSubject, finalize, Observable, tap} from "rxjs";
import { Lecturer } from "../models/lecturer.model";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import {Faculty} from "../models/faculty.model";
import {AResourceService} from "./a-resource.service";
import {finalizeLoading} from "../shared/operators/finalize-loading.operator";

@Injectable({
  providedIn: 'root'
})
export class LecturerService extends AResourceService<Lecturer> {

  public getLecturersGroupedByFaculty(faculties: Faculty[]) {
    return this.models.filter(l => faculties.map(f => f.id).indexOf(l.faculty.id) !== -1).reduce((acc, lecturer) => {
      const existingFaculty = acc.find(item => item.value.id === lecturer.faculty.id);
      if (existingFaculty) {
        existingFaculty.items.push(lecturer);
      } else {
        acc.push({ label: lecturer.faculty.name, value: lecturer.faculty, items: [lecturer] });
      }
      return acc;
    }, []);
  }

  constructor(private http: HttpClient) {
    super('lecturers')
  }

  override getAll(): void {
    if (!this.models?.length) this._loading.next(true);
    this.http.get<Lecturer[]>(environment.apiUrl + `lecturers`)
      .pipe(finalizeLoading(this._loading, false))
      .subscribe({
        next: (lecturers) => this.models = lecturers
      });
  }

  create(name: string, hourlyRate: number, dailyRate: number, facultyId: number): Observable<Lecturer> {
    const data = {
      name: name,
      hourlyRate: hourlyRate * 100,
      dailyRate: dailyRate * 100
    }
    return this.http.post<Lecturer>(environment.adminApiUrl + `faculties/${facultyId}/lecturers`, data)
      .pipe(
        tap((model) => {
          this.addModel(model);
        }),
      )
  }

  public update(id: number, name: string, hourlyRate: number, dailyRate: number, facultyId: number): Observable<any> {
    const data = {
      id: id,
      name: name,
      hourlyRate: hourlyRate * 100,
      dailyRate: dailyRate * 100,
      facultyId: facultyId,
    }
    return this.http.put<any>(environment.adminApiUrl + `faculties/${facultyId}/lecturers/${id}`, data)
      .pipe(
        tap((model) => {
          this.updateModel(model);
        }),
      )
  }

  delete(id: number, facultyId: number): Observable<any> {
    return this.http.delete<any>(environment.adminApiUrl + `faculties/${facultyId}/lecturers/${id}`)
      .pipe(
        tap((model) => {
          this.removeModel(id);
        }),
      )
  }
}
