import {Injectable} from '@angular/core';
import {Observable, tap} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {Company} from '../models/company.model';
import {AResourceService} from "./a-resource.service";
import {finalizeLoading} from "../shared/operators/finalize-loading.operator";

@Injectable({
  providedIn: 'root'
})

export class CompanyService extends AResourceService<Company> {
  constructor(private http: HttpClient) {
    super('companies')
  }

  override getAll(): void {
    if (!this.models?.length) this._loading.next(true)
    this.http.get<Company[]>(environment.apiUrl + `companies`)
      .pipe(finalizeLoading(this._loading, false))
      .subscribe({
        next: (companies) => this.models = companies
      });
  }

  create(imageData: FormData, name: string): Observable<Company> {
    imageData.append('companyName', name);

    return this.http.post<Company>(environment.adminApiUrl + 'companies', imageData)
      .pipe(
        tap((model) => {
          this.addModel(model);
        }),
      )
  }

  update(id: number, imageData: FormData, name: string): Observable<any> {
    imageData.append('companyName', name);

    // formdata can only be sent via POST, therefore we do not use PUT
    return this.http.post<Company>(environment.adminApiUrl + `companies/${id}`, imageData)
      .pipe(
        tap((model) => {
          this.updateModel(model);
        }),
      )
  }

  delete(id: number): Observable<any> {
    return this.http.delete<Company>(environment.adminApiUrl + `companies/${id}`)
      .pipe(
        tap(() => {
          this.removeModel(id);
        }),
      );
  }
}
