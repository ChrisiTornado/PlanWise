import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {AModel} from "../models/a-model.model";

@Injectable({
  providedIn: 'root'
})
export abstract class AResourceService<M extends AModel> {
  modelsStorageName: string

  protected _models: BehaviorSubject<M[]>;

  public get models$(): Observable<M[]> {
    return this._models.asObservable();
  }

  public get models(): M[] {
    return this._models.value;
  }

  public set models(models: M[]) {
    sessionStorage.setItem(this.modelsStorageName, JSON.stringify(models));
    this._models.next(models);
  }

  protected _loading: BehaviorSubject<boolean>;

  public get loading$(): Observable<boolean> {
    return this._loading.asObservable();
  }

  protected constructor(modelsStorageName: string, fetchStorage: boolean = true) {
    this.modelsStorageName = modelsStorageName
    let savedModels = fetchStorage ? JSON.parse(sessionStorage.getItem(modelsStorageName)) : null;
    this._models = new BehaviorSubject<M[]>(savedModels);
    this._loading = new BehaviorSubject<boolean>(false);
  }

  public abstract getAll(): void

  public addModel(model: M) {
    let m = this.models ?? []
    m.push(model)
    this.models = m
  }

  public updateModel(model: M) {
    this.models = (this.models ?? []).map(m => m.id == model.id ? model : m)
  }

  public removeModel(id: number) {
    this.models = (this.models ?? []).filter(m => m.id !== id);
  }

  public reset() {
    this.models = []
  }
}
