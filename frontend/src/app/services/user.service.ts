import { Injectable } from '@angular/core';
import {Observable, tap} from "rxjs";
import {User} from "../models/user.model";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {AResourceService} from "./a-resource.service";
import {finalizeLoading} from "../shared/operators/finalize-loading.operator";

@Injectable({
  providedIn: 'root'
})
export class UserService extends AResourceService<User>{

  constructor(private http: HttpClient) {
    super('users')
  }

  override getAll() {
    if (!this.models?.length) this._loading.next(true);
    this.http.get<User[]>(environment.adminApiUrl + 'users')
      .pipe(finalizeLoading(this._loading, false))
      .subscribe({
        next: (users) => {
          this.models = users;
        }
      });
  }

  public delete(id: number): Observable<any> {
    return this.http.delete<any>(environment.adminApiUrl + `users/${id}`)
      .pipe(
        tap(() => {
          this.removeModel(id)
        })
      )
  }

  public create(name: string, facultyId: number): Observable<User> {
    const data = {
      email: name,
      faculty_id: facultyId
    };

    return this.http.post<User>(environment.adminApiUrl + 'users', data)
      .pipe(
        tap(model => {
          this.addModel(model)
        })
      )
  }
}
