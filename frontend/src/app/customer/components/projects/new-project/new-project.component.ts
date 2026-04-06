import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormGroup} from "@angular/forms";
import { MessageService } from 'primeng/api';
import {ExpenseService} from "../../../../services/expense.service";
import {ProjectTypeService} from "../../../../services/project-type.service";
import {finalize} from "rxjs";
import {LecturerService} from "../../../../services/lecturer.service";
import {ProjectService} from "../../../../services/project.service";
import {AuthService} from "../../../../services/auth/auth.service";
import {Router} from "@angular/router";
import {DatePipe} from "@angular/common";
import { CompanyService } from 'src/app/services/company.service';

@Component({
  selector: 'app-new-project',
  templateUrl: './new-project.component.html',
  styleUrls: ['./new-project.component.scss']
})
export class NewProjectComponent implements OnInit{
  newProjectForm: FormGroup;
  submitted: boolean = false;
  loading: boolean = false;
  totalCost: number = 0;

  constructor(private messageService: MessageService,
              private projectService: ProjectService,
              private authService: AuthService,
              private router: Router,
              public projectTypeService: ProjectTypeService,
              public expenseService: ExpenseService,
              public lecturerService: LecturerService,
              public companyService: CompanyService,
              private datePipe: DatePipe) {

  }

  ngOnInit() {
  }

  formChanges(fg: FormGroup) {
    this.newProjectForm = fg;
  }

  costChanges(costs: number) {
    this.totalCost = costs;
  }

  create() {
    this.submitted = true;
    if(this.newProjectForm.invalid) {
      this.newProjectForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.projectService.create(
      this.authService.user.faculty.id,
      this.projectType.value.id,
      this.company.value.id,
      this.name.value,
      this.datePipe.transform(this.start.value, 'YYYY-MM-dd'),
      this.datePipe.transform(this.end.value, 'YYYY-MM-dd'),
      this.firstname.value,
      this.lastname.value,
      this.email.value,
      this.crossFaculty.value,
      this.notes.value,
      this.deduplicateProjectExpenses(this.projectExpenses.value),
      this.deduplicateProjectLecturers(this.projectLecturers.value),
      this.totalCost * 100,
      this.participants.value,
      this.duration.value,
      this.ects.value,
      this.crossFaculties.value
    )
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: project  => {
          this.router.navigate(['/projects']).then(() => {
            setTimeout(() => {
              this.messageService.add({severity:'success', summary:'Erfolg', detail:'Projekt wurde gespeichert'});
            },1);
            // this.projectService.getAllByFaculty(this.authService.user.faculty.id)
          })
        },
        error: err => this.messageService.add({severity:'error', summary:'Fehler', detail:'Projekt konnte nicht gespeichert werden'})
      });
  }

  get name(): AbstractControl {
    return this.newProjectForm.get("name");
  }

  get firstname(): AbstractControl {
    return this.newProjectForm.get("firstname");
  }

  get lastname(): AbstractControl {
    return this.newProjectForm.get("lastname");
  }

  get email(): AbstractControl {
    return this.newProjectForm.get("email");
  }

  get ects(): AbstractControl {
    return this.newProjectForm.get("ects");
  }

  get start(): AbstractControl {
    return this.newProjectForm.get("start");
  }

  get end(): AbstractControl {
    return this.newProjectForm.get("end");
  }

  get crossFaculty(): AbstractControl {
    return this.newProjectForm.get("crossFaculty");
  }

  get notes(): AbstractControl {
    return this.newProjectForm.get("notes");
  }

  get projectType(): AbstractControl {
    return this.newProjectForm.get("projectType");
  }

  get company(): AbstractControl {
    return this.newProjectForm.get("company");
  }

  get projectLecturers(): FormArray {
    return this.newProjectForm.get("projectLecturers") as FormArray;
  }

  get projectExpenses(): FormArray {
    return this.newProjectForm.get("projectExpenses") as FormArray;
  }

  get participants(): AbstractControl {
    return this.newProjectForm.get("participants");
  }

  get duration(): AbstractControl {
    return this.newProjectForm.get("duration");
  }

  get crossFaculties(): FormArray {
    return this.newProjectForm.get("crossFaculties") as FormArray;
  }

  private deduplicateProjectLecturers(lecturers: any[]): any[] {
    return Array.from(
      new Map(lecturers.map(lecturer => [lecturer.lecturer?.id, lecturer])).values()
    );
  }

  private deduplicateProjectExpenses(expenses: any[]): any[] {
    return Array.from(
      new Map(expenses.map(expense => [expense.expense?.id, expense])).values()
    );
  }
}
