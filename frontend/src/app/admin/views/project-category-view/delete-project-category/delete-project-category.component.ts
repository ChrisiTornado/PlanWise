import {Component, Input} from '@angular/core';
import {finalize} from "rxjs";
import {ConfirmationService} from "primeng/api";

import {ProjectType} from 'src/app/models/project-type.model';
import {ProjectTypeService} from 'src/app/services/project-type.service';

@Component({
  selector: 'app-delete-project-category',
  template: `
    <p-button icon="pi pi-trash" styleClass="p-button-danger" [loading]="loading" (click)="delete()"></p-button>
  `,
})
export class DeleteProjectCategoryComponent {
  @Input() projectType: ProjectType
  loading: boolean;

  constructor(private projectTypeService: ProjectTypeService,
              private confirmationService: ConfirmationService) {
  }

  delete() {
    this.confirmationService.confirm({
      header: 'Projektart löschen',
      message: `Möchtest du "${this.projectType.name}" wirklich löschen?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.projectTypeService.delete(this.projectType.id)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
            }
          })
      }
    });
  }
}
