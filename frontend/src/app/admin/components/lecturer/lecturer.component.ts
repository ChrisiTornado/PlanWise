import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import { LecturerService } from 'src/app/services/lecturer.service';
import { FacultyService } from "../../../services/faculty.service";
import { Faculty } from 'src/app/models/faculty.model';
import {MessageService} from "primeng/api";
import {finalize} from "rxjs";

@Component({
  selector: 'app-lecturer',
  templateUrl: './lecturer.component.html',
  styleUrls: ['./lecturer.component.scss']
})
export class LecturerComponent implements OnInit{
  createForm: FormGroup;
  visible: boolean;
  submitted: boolean;
  loading: boolean;
  faculty: Faculty;

  constructor(private formBuilder: FormBuilder,
              public lecturerService: LecturerService,
              public facultyService: FacultyService,
              private messageService: MessageService) {
  }

  ngOnInit() {
    this.createForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      hourlyRate: [null, [Validators.required]],
      dailyRate: [null, [Validators.required]]
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

    this.lecturerService.create(this.name.value, this.hourlyRate.value, this.dailyRate.value, this.faculty.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Erfolgreich', detail: 'Der Lektor wurde angelegt.' });
          this.closeDialog();
        },
        error: (err) => {
          console.log(err);
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Der Lektor konnte nicht angelegt werden.' });
        }
      })
  }

  get name(): AbstractControl {
    return this.createForm.get('name');
  }

  get hourlyRate(): AbstractControl {
    return this.createForm.get('hourlyRate');
  }

  get dailyRate(): AbstractControl {
    return this.createForm.get('dailyRate');
  }

  selectedFaculty(incomingfaculty: any) {
    this.faculty = incomingfaculty;
  }
}
