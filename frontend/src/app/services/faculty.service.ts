import { Injectable } from '@angular/core';
import {finalize, Observable, tap} from "rxjs";
import {Faculty} from "../models/faculty.model";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {AResourceService} from "./a-resource.service";

@Injectable({
  providedIn: 'root'
})
export class FacultyService extends AResourceService<Faculty> {
  constructor(private http: HttpClient) {
    super('faculties')
  }

  override getAll(requestedByCustomer: boolean = false) {
    if (!this.models?.length) this._loading.next(true);
    this.http.get<Faculty[]>((requestedByCustomer ? environment.apiUrl : environment.adminApiUrl) + 'faculties')
      .pipe(finalize(() => this._loading.next(false)))
      .subscribe({
        next: (faculties) => {
          this.models = faculties;
        }
      });
  }

  public delete(id: number): Observable<any> {
    return this.http.delete<any>(environment.adminApiUrl + `faculties/${id}`)
      .pipe(
        tap(() => {
          this.removeModel(id);
        })
      )
  }

  public create(name: string, priceForCoursePerDay: number): Observable<Faculty> {
    return this.http.post<Faculty>(environment.adminApiUrl + 'faculties', { name, priceForCoursePerDay: priceForCoursePerDay * 100 })
      .pipe(
        tap((model) => {
          this.addModel(model);
        }),
      )
  }

  public update(id: number, name: string, priceForCoursePerDay: number): Observable<Faculty> {
    return this.http.put<Faculty>(environment.adminApiUrl + `faculties/${id}`, { name, priceForCoursePerDay: priceForCoursePerDay * 100 })
      .pipe(
        tap((model) => {
          this.updateModel(model);
        }),
      )
  }
}
