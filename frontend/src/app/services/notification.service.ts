import { Injectable } from '@angular/core';
import {BehaviorSubject, finalize, Observable, tap} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {Notification} from "../models/notification.model";
import {AResourceService} from "./a-resource.service";
import {finalizeLoading} from "../shared/operators/finalize-loading.operator";

@Injectable({
  providedIn: 'root'
})
export class NotificationService extends AResourceService<Notification>{
  constructor(private http: HttpClient) {
    super('notifications', false)
  }

  override getAll() {
    if (!this.models?.length) this._loading.next(true);
    this.http.get<Notification[]>(environment.adminApiUrl + 'notifications')
      .pipe(finalizeLoading(this._loading, false))
      .subscribe({
        next: (notifications) => {
          this.models = notifications;
        }
      });
  }

  public update(id: number, email: string, activated: boolean): Observable<Notification> {
    return this.http.put<Notification>(environment.adminApiUrl + `notifications/${id}`, { email, activated })
      .pipe(
        tap((model) => {
          this.updateModel(model);
        }),
      )
  }
}
