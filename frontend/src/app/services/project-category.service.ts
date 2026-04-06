import { Injectable } from '@angular/core';
import {BehaviorSubject, finalize, Observable, tap} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import { ProjectCategory } from '../models/project-category.model';
import {AResourceService} from "./a-resource.service";
import {finalizeLoading} from "../shared/operators/finalize-loading.operator";

@Injectable({
  providedIn: 'root'
})
export class ProjectCategoryService extends AResourceService<ProjectCategory>{

  constructor(private http: HttpClient) {
    super('projectCategories')
  }

  override getAll(): void {
    if (!this.models?.length) this._loading.next(true);
    this.http.get<ProjectCategory[]>(environment.apiUrl + `projectCategories`)
      .pipe(finalizeLoading(this._loading, false))
      .subscribe({
        next: (projectCategories) => this.models = projectCategories
      });
  }

  create(name: string): Observable<ProjectCategory> {
    let data = {
      name: name
    }
    return this.http.post<ProjectCategory>(environment.adminApiUrl + 'projectCategories', data)
      .pipe(
        tap(model => {
          this.addModel(model)
        })
      )
  }

  public update(id: number, name: string): Observable<any> {
    return this.http.put<any>(environment.adminApiUrl + `projectCategories/${id}`, { name })
      .pipe(
        tap(model => {
          this.updateModel(model)
        })
      )
  }


  delete(id: number): Observable<any> {
    return this.http.delete<any>(environment.adminApiUrl + `projectCategories/${id}`)
      .pipe(
        tap(() => {
          this.removeModel(id)
        })
      )
  }
}
