import {Component, Input} from '@angular/core';
import {finalize} from "rxjs";
import {ConfirmationService} from "primeng/api";
import {Faculty} from "../../../../models/faculty.model";
import {FacultyService} from "../../../../services/faculty.service";

@Component({
  selector: 'app-faculty-delete',
  template: `
    <p-button icon="pi pi-trash" styleClass="p-button-danger" [loading]="loading" (click)="delete()"></p-button>
  `,
  styles: []
})
export class DeleteFacultyComponent {
  @Input() faculty: Faculty;
  loading: boolean;

  constructor(private facultyService: FacultyService,
              private confirmationService: ConfirmationService) {
  }

  delete() {
    this.confirmationService.confirm({
      header: 'Fakultät löschen',
      message: `Möchtest du "${this.faculty.name}" wirklich löschen?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.facultyService.delete(this.faculty.id)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
            }
          })
      }
    });
  }
}
