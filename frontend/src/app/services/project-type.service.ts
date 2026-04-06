import { Injectable } from '@angular/core';
import {BehaviorSubject, finalize, Observable, tap} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {ProjectType} from "../models/project-type.model";
import {AResourceService} from "./a-resource.service";
import {finalizeLoading} from "../shared/operators/finalize-loading.operator";

@Injectable({
  providedIn: 'root'
})
export class ProjectTypeService extends AResourceService<ProjectType> {

  constructor(private http: HttpClient) {
    super('projectTypes')
  }

  override getAll(): void {
    if (!this.models?.length) this._loading.next(true);
    this.http.get<ProjectType[]>(environment.apiUrl + `project-types`)
      .pipe(finalizeLoading(this._loading, false))
      .subscribe({
        next: (projectTypes) => this.models = projectTypes
      });
  }

  create(name: string, code: string, isCourse: boolean): Observable<ProjectType> {
    let data = {
      name: name,
      code: code,
      isCourse: isCourse
    }
    return this.http.post<ProjectType>(environment.adminApiUrl + 'project-types', data)
      .pipe(
        tap(model => {
          this.addModel(model)
        })
      )
  }

  update(id: number, name: string, code: string, isCourse: boolean): Observable<ProjectType> {
    let data = {
      name: name,
      code: code,
      isCourse: isCourse
    }
    return this.http.put<ProjectType>(environment.adminApiUrl + `project-types/${id}`, data)
      .pipe(
        tap(model => {
          this.updateModel(model)
        })
      )
  }

  delete(id: number): Observable<ProjectType> {
    return this.http.delete<ProjectType>(environment.adminApiUrl + `project-types/${id}`)
      .pipe(
        tap(() => {
          this.removeModel(id)
        })
      )
  }
}
