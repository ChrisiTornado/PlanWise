import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {FacultyService} from "../../../services/faculty.service";
import {MessageService} from "primeng/api";
import {finalize} from "rxjs";


@Component({
  selector: 'app-faculties',
  templateUrl: './faculties.component.html',
  styleUrls: ['./faculties.component.scss']
})
export class FacultiesComponent implements OnInit {
  createForm: FormGroup;
  visible: boolean;
  submitted: boolean;
  loading: boolean;

  constructor(private formBuilder: FormBuilder,
              public facultyService: FacultyService,
              private messageService: MessageService) {
  }

  ngOnInit() {
    this.createForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      priceForCoursePerDay: [null, [Validators.required, Validators.min(1)]],
    });
  }

  openDialog() {
    this.visible = true;
  }

  closeDialog() {
    this.visible = false;
    this.submitted = false;
    this.createForm.reset();
  }

  submit() {
    this.submitted = true;
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }

    this.loading = true;

    this.facultyService.create(this.name.value, this.priceForCoursePerDay.value)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Erfolgreich', detail: 'Die Fakultät wurde erstellt.' });
          this.closeDialog();
        },
        error: (err) => {
          console.log(err);
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Die Fakultät konnte nicht erstellt werden.' });
        }
      })
  }

  get name(): AbstractControl {
    return this.createForm.get('name');
  }

  get priceForCoursePerDay(): AbstractControl {
    return this.createForm.get('priceForCoursePerDay');
  }
}
