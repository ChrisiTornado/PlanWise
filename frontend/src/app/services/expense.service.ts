import { Injectable } from '@angular/core';
import {Observable, tap} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {Expense} from "../models/expense.model";
import {AResourceService} from "./a-resource.service";
import {finalizeLoading} from "../shared/operators/finalize-loading.operator";

@Injectable({
  providedIn: 'root'
})
export class ExpenseService extends AResourceService<Expense>{

  constructor(private http: HttpClient) {
    super('expenses')
  }

  override getAll(): void {
    if (!this.models?.length) this._loading.next(true);
    this.http.get<Expense[]>(environment.apiUrl + `expenses`)
      .pipe(finalizeLoading(this._loading, false))
      .subscribe({
        next: (expenses) => this.models = expenses
      });
  }

  create(name: string): Observable<Expense> {
    let data = {
      name: name
    }
    return this.http.post<Expense>(environment.adminApiUrl + 'expenses', data)
      .pipe(
        tap((model) => {
          this.addModel(model);
        }),
      )
  }

  public update(id: number, name: string): Observable<any> {
    return this.http.put<any>(environment.adminApiUrl + `expenses/${id}`, { name })
      .pipe(
        tap((model) => {
          this.updateModel(model);
        }),
      )
  }


  delete(id: number): Observable<any> {
    return this.http.delete<any>(environment.adminApiUrl + `expenses/${id}`)
      .pipe(
        tap(() => {
          this.removeModel(id);
        }),
      );
  }
}
