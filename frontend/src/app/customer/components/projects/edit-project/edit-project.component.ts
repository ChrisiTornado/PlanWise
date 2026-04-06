import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {MessageService} from "primeng/api";
import {ProjectService} from "../../../../services/project.service";
import {finalize} from "rxjs";
import {AuthService} from "../../../../services/auth/auth.service";
import {EProjectState, Project} from "../../../../models/project.model";
import {AbstractControl, FormArray, FormGroup} from "@angular/forms";
import {ProjectFormComponent} from "../project-form/project-form.component";
import {LoadingSpinnerComponent} from "../../../../shared/components/loading-spinner/loading-spinner.component";
import {NgIf} from "@angular/common";
import {ERole} from "../../../../models/user.model";
import {DatePipe} from "@angular/common";
import {ProjectTypeService} from "../../../../services/project-type.service";

@Component({
  selector: 'app-edit-project',
  standalone: true,
  templateUrl: './edit-project.component.html',
  imports: [
    ProjectFormComponent,
    LoadingSpinnerComponent,
    NgIf
  ],
  styleUrls: ['./edit-project.component.scss'],
  providers: [DatePipe]
})
export class EditProjectComponent implements OnInit {
  loading: boolean;
  updateLoading: boolean;
  updateStateLoading: boolean;
  project: Project;
  submitted: boolean;
  editProjectForm: FormGroup;
  totalCost: number = 0;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private messageService: MessageService,
              private authService: AuthService,
              public projectService: ProjectService,
              private datePipe: DatePipe,
              public projectTypeService: ProjectTypeService) {
  }

  ngOnInit() {
    let id = +this.route.snapshot.paramMap.get('id');
    if(!id || isNaN(id)) {
      this.router.navigate(['/projects']).then(() => {
        setTimeout(() => {
          this.messageService.add({severity: 'error', summary: 'Fehler', detail: 'Das Projekt existiert nicht.'});
        }, 1)
      });
      return;
    }

    this.loading = true;
    (this.authService.user.role == ERole.ADMIN ?
      this.projectService.getOneAdmin(id) :
      this.projectService.getOne(id, this.authService.user.faculty.id)
    )
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (project) => {
          this.project = project;
          // to update isOpened
          if(this.projectService.models)
            this.projectService.updateModel(project)
        },
        error: () => {
          this.router.navigate(['/projects']).then(() => {
            setTimeout(() => {
              this.messageService.add({severity: 'error', summary: 'Fehler', detail: 'Das Projekt konnte nicht abgerufen werden.'});
            }, 1)
          });
        }
      })
  }

  formChanges(fg: FormGroup) {
    this.editProjectForm = fg;
  }

  costChanges(costs: number) {
    this.totalCost = costs;
  }

  update() {
    this.submitted = true;
    if(this.editProjectForm.invalid) {
      this.editProjectForm.markAllAsTouched();
      return;
    }

    this.updateLoading = true;

    this.projectService.update(
      this.project.id,
      this.project.faculty.id,
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
      this.projectExpenses.value,
      this.projectLecturers.value,
      this.totalCost * 100,
      this.participants.value,
      this.duration.value,
      this.ects.value,
      this.crossFaculties.value,
      this.priceForCoursePerDayOverride.value,
      this.authService.user.role == ERole.ADMIN ? this.otherExpenses.value : this.project.otherExpenses,
      this.authService.user.role == ERole.ADMIN ? this.groupSpecificExpenses.value : this.project.groupSpecificExpenses
    )
      .pipe(
        finalize(() => this.updateLoading = false)
      )
      .subscribe({
        next: project  => {
          this.project = project
          this.messageService.add({severity:'success', summary:'Erfolg', detail:'Projektänderungen wurden erfolgreich gespeichert'});
        }
      });
  }

  updateState(state: EProjectState) {
    this.updateStateLoading = true
    this.projectService.updateState(this.project.id, state)
      .pipe(
        finalize(() => this.updateStateLoading = false)
      )
      .subscribe({
        next: (project) => {
          this.project.state = project.state
          this.project.stateChangedAt = project.stateChangedAt
        }
      })
  }

  get name(): AbstractControl {
    return this.editProjectForm.get("name");
  }

  get firstname(): AbstractControl {
    return this.editProjectForm.get("firstname");
  }

  get lastname(): AbstractControl {
    return this.editProjectForm.get("lastname");
  }

  get email(): AbstractControl {
    return this.editProjectForm.get("email");
  }

  get start(): AbstractControl {
    return this.editProjectForm.get("start");
  }

  get end(): AbstractControl {
    return this.editProjectForm.get("end");
  }

  get crossFaculty(): AbstractControl {
    return this.editProjectForm.get("crossFaculty");
  }

  get notes(): AbstractControl {
    return this.editProjectForm.get("notes");
  }

  get projectType(): AbstractControl {
    return this.editProjectForm.get("projectType");
  }

  get company(): AbstractControl {
    return this.editProjectForm.get("company");
  }

  get projectLecturers(): FormArray {
    return this.editProjectForm.get("projectLecturers") as FormArray;
  }

  get projectExpenses(): FormArray {
    return this.editProjectForm.get("projectExpenses") as FormArray;
  }

  get participants(): AbstractControl {
    return this.editProjectForm.get("participants");
  }

  get duration(): AbstractControl {
    return this.editProjectForm.get("duration");
  }

  get ects(): AbstractControl {
    return this.editProjectForm.get("ects");
  }

  get crossFaculties(): FormArray {
    return this.editProjectForm.get("crossFaculties") as FormArray;
  }

  get priceForCoursePerDayOverride(): AbstractControl {
    return this.editProjectForm.get("priceForCoursePerDayOverride");
  }

  get otherExpenses(): FormArray {
    return this.editProjectForm.get("otherExpenses") as FormArray;
  }

  get groupSpecificExpenses(): FormArray {
    return this.editProjectForm.get("groupSpecificExpenses") as FormArray;
  } 
}
