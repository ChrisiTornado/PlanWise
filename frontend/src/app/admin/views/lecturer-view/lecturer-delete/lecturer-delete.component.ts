import {Component, Input} from '@angular/core';
import {finalize} from "rxjs";
import {ConfirmationService} from "primeng/api";
import {Lecturer} from 'src/app/models/lecturer.model';
import {LecturerService} from 'src/app/services/lecturer.service';

@Component({
  selector: 'app-lecturer-delete',
  template: `
  <p-button icon="pi pi-trash" styleClass="p-button-danger" [loading]="loading" (click)="delete()"></p-button>
`,
  styles: []
})
export class LecturerDeleteComponent {
  @Input() lecturer: Lecturer;
  loading: boolean;

  constructor(private lecturerService: LecturerService,
              private confirmationService: ConfirmationService) {
  }

  delete() {
    this.confirmationService.confirm({
      header: 'Vortragende/n löschen',
      message: `Möchtest du "${this.lecturer.name}" wirklich löschen?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.lecturerService.delete(this.lecturer.id, this.lecturer.faculty.id)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
            }
          })
      }
    });
  }
}
