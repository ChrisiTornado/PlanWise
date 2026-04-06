import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ProjectTypeService} from "../../../../services/project-type.service";
import {EProjectState, getProjectStateIconClass, getProjectStateLabel, Project} from "../../../../models/project.model";
import {ExpenseService} from "../../../../services/expense.service";
import {LecturerService} from "../../../../services/lecturer.service";
import Utils from "../../../../shared/utils";
import {ProjectService} from "../../../../services/project.service";
import {AuthService} from "../../../../services/auth/auth.service";
import {ProjectType} from "../../../../models/project-type.model";
import {FacultyService} from "../../../../services/faculty.service";
import { CompanyService } from 'src/app/services/company.service';
import {MultiSelect, MultiSelectModule} from "primeng/multiselect";
import {DropdownModule} from "primeng/dropdown";
import {AsyncPipe, CurrencyPipe, DatePipe, NgIf} from "@angular/common";
import {InputTextModule} from "primeng/inputtext";
import {CalendarModule} from "primeng/calendar";
import {InputTextareaModule} from "primeng/inputtextarea";
import {ProjectExpensesComponent} from "./project-expenses/project-expenses.component";
import {CheckboxModule} from "primeng/checkbox";
import {ProjectLecturersComponent} from "./project-lecturers/project-lecturers.component";
import {ExportButtonsComponent} from "../export-buttons/export-buttons.component";
import {LoadingSpinnerComponent} from "../../../../shared/components/loading-spinner/loading-spinner.component";
import {ToastModule} from "primeng/toast";
import {Ripple} from "primeng/ripple";
import {ERole} from "../../../../models/user.model";
import {Faculty} from "../../../../models/faculty.model";
import {InputNumberModule} from "primeng/inputnumber";
import {ProjectOtherExpensesComponent} from "./project-other-expenses/project-other-expenses.component";
import {CalculationsComponent} from "./calculations/calculations.component";
import { ProjectGroupSpecificExpensesComponent } from './project-group-specific-expenses/project-group-specific-expenses.component';

@Component({
  selector: 'app-project-form',
  standalone: true,
  templateUrl: './project-form.component.html',
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    DropdownModule,
    InputTextModule,
    NgIf,
    CalendarModule,
    InputTextareaModule,
    ProjectExpensesComponent,
    CheckboxModule,
    MultiSelectModule,
    ProjectLecturersComponent,
    CurrencyPipe,
    ExportButtonsComponent,
    LoadingSpinnerComponent,
    ToastModule,
    Ripple,
    InputNumberModule,
    ProjectOtherExpensesComponent,
    ProjectGroupSpecificExpensesComponent,
    CalculationsComponent,
    DatePipe
  ],
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit, AfterViewInit {
  @Output() formChangesEmitter: EventEmitter<FormGroup> = new EventEmitter<FormGroup>();
  @Output() costChangesEmitter: EventEmitter<number> = new EventEmitter<number>();
  @Output() revenueChangesEmitter: EventEmitter<number> = new EventEmitter<number>();
  @Output() submitEmitter: EventEmitter<void> = new EventEmitter<void>();
  @Output() stateChangeEmitter: EventEmitter<EProjectState> = new EventEmitter<EProjectState>();

  @Input() project: Project = null;
  @Input() submitLabel: string;
  @Input() title: string;
  @Input() submitted: boolean;
  @Input() loading: boolean = false;
  @Input() stateLoading: boolean = false;
  @Input() exportOptions: boolean;

  @ViewChild('crossFacultySelect') crossFacultySelect: MultiSelect

  projectForm: FormGroup;
  totalCost?: number = null;
  revenue?: number = null;
  dropDownLecturers;
  dropDownFaculties;
  faculty: Faculty;
  showDetailedCalculations: boolean = false

  constructor(private formBuilder: FormBuilder,
              public projectTypeService: ProjectTypeService,
              public projectService: ProjectService,
              public expenseService: ExpenseService,
              public authService: AuthService,
              private ref: ChangeDetectorRef,
              public lecturerService: LecturerService,
              private facultyService: FacultyService,
              public companyService: CompanyService) {
  }

  ngOnInit() {
    this.faculty = this.authService.user.role == ERole.ADMIN ? this.project.faculty : this.authService.user.faculty
    this.dropDownFaculties = this.facultyService.models.filter(f => f.id != this.faculty.id)

    this.projectForm = this.formBuilder.group({
      name: [this.project ? this.project.name : null, [Validators.required]],
      firstname: [this.project ? this.project.firstname : null, [Validators.required]],
      lastname: [this.project ? this.project.lastname : null, [Validators.required]],
      email: [this.project ? this.project.email : null, [Validators.required, Validators.email]],
      start: [this.project ? new Date(this.project.start) : null, [Validators.required]],
      end: [this.project ? new Date(this.project.end) : null, [Validators.required]],
      crossFaculty: this.project ? this.project.crossFaculty : false,
      notes: this.project ? this.project.notes : null,
      projectType: [this.project ? this.project.projectType : this.projectTypeService.models[0], [Validators.required]],
      company: [this.project ? this.project.company : this.companyService.models[0], [Validators.required]],
      projectExpenses: this.formBuilder.array([]),
      projectLecturers: this.formBuilder.array([]),
      participants: [this.project ? this.project.participants : null],
      duration: [this.project ? this.project.duration : null],
      ects: [this.project ? this.project.ects : null],
      crossFaculties: [this.project ? this.getCrossFacultiesValue() : []],
      priceForCoursePerDayOverride: [this.project ? (this.project.priceForCoursePerDayOverride ?? this.project.faculty.priceForCoursePerDay) : this.faculty.priceForCoursePerDay],
      otherExpenses: this.formBuilder.array([]),
      groupSpecificExpenses: this.formBuilder.array([])
    });

    this.setLecturers()
    this.setCourseValidators()

    this.projectForm.valueChanges.subscribe({
      next: (fg) => {
        this.formChangesEmitter.emit(this.projectForm);
        this.costChanges();
      }
    });

    this.crossFaculty.valueChanges.subscribe({
      next: (cf) => {
        this.setLecturers();
      }
    })

    this.crossFaculties.valueChanges.subscribe({
      next: (cf) => {
        this.setLecturers();
      }
    })

    this.projectType.valueChanges.subscribe({
      next: (pt: ProjectType) => {
        this.setCourseValidators()
      }
    })
  }

  // Workaround
  ngAfterViewInit() {
    if(this.project && this.project.crossFaculty) {
      this.crossFacultySelect.updateModel(this.getCrossFacultiesValue())
      this.ref.detectChanges()
    }
  }

  getCrossFacultiesValue() {
    return this.dropDownFaculties.filter(dropDownFaculty => this.project.crossFaculties.map(cross => cross.id).indexOf(dropDownFaculty.id) != -1)
  }

  setLecturers() {
    this.dropDownLecturers = this.crossFaculty.value ? this.lecturerService.getLecturersGroupedByFaculty([...(this.crossFaculties.value ?? []), ...[this.faculty]]) : this.lecturerService.models.filter(l => l.faculty.id == this.faculty.id);
  }

  setCourseValidators() {
    if(this.projectType.value.isCourse) {
      this.participants.setValidators([Validators.required, Validators.min(1)])
      this.duration.setValidators([Validators.required, Validators.min(1)])
    } else {
      this.participants.clearValidators()
      this.duration.clearValidators()
    }
    this.participants.updateValueAndValidity()
    this.duration.updateValueAndValidity()
    this.projectForm.updateValueAndValidity()
  }

  costChanges() {
    this.calculateTotalCost()
    this.costChangesEmitter.emit(this.totalCost)
    this.revenueChangesEmitter.emit(this.revenue)
  }

  calculateTotalCost() {
    if(this.projectLecturers.invalid || this.projectExpenses.invalid) {
      this.totalCost = null;
      return;
    }

    this.totalCost = Utils.calculateProjectCosts(this.projectLecturers.value, this.projectExpenses.value, this.calculationOtherExpenses, this.participants.value, this.calculationGroupSpecificExpenses);
    if(!this.isCourse)
      return;

    if(this.participants.invalid || this.duration.invalid) {
      this.revenue = null
      return
    }

    this.revenue = this.participants.value * (this.priceForCoursePerDayOverride.value ?? this.faculty.priceForCoursePerDay) * this.duration.value
  }

  get calculationOtherExpenses(): any[] {
    return this.isAdmin ? this.otherExpenses.value : []
  }

  get calculationGroupSpecificExpenses(): any[] {
    return this.isAdmin ? this.groupSpecificExpenses.value : []
  }

  get isAdmin(): boolean {
    return this.authService.user?.role == ERole.ADMIN
  }

  get canShowDetailedCalculations(): boolean {
    return this.isCourse || this.isAdmin
  }

  get breakEvenParticipants(): number | null {
    if (!this.isCourse)
      return null

    return Utils.getBreakEvenParticipants(
      this.projectLecturers.value,
      this.projectExpenses.value,
      this.calculationOtherExpenses,
      this.calculationGroupSpecificExpenses,
      this.duration.value,
      this.priceForCoursePerDayOverride.value
    )
  }

  get projectProfit(): number {
    if (!this.isCourse)
      return null

    return Utils.getProfit(
      this.projectLecturers.value,
      this.projectExpenses.value,
      this.calculationOtherExpenses,
      this.calculationGroupSpecificExpenses,
      this.participants.value,
      this.duration.value,
      this.priceForCoursePerDayOverride.value
    )
  }

  get projectHasProfit(): boolean {
    return this.projectProfit >= 0
  }

  get company(): AbstractControl {
    return this.projectForm.get("company");
  }

  get projectType(): AbstractControl {
    return this.projectForm.get("projectType");
  }

  get name(): AbstractControl {
    return this.projectForm.get("name");
  }

  get firstname(): AbstractControl {
    return this.projectForm.get("firstname");
  }

  get lastname(): AbstractControl {
    return this.projectForm.get("lastname");
  }

  get email(): AbstractControl {
    return this.projectForm.get("email");
  }

  get start(): AbstractControl {
    return this.projectForm.get("start");
  }

  get end(): AbstractControl {
    return this.projectForm.get("end");
  }

  get notes(): AbstractControl {
    return this.projectForm.get("notes");
  }

  get crossFaculty(): AbstractControl {
    return this.projectForm.get("crossFaculty");
  }

  // get projectType(): AbstractControl {
  //   return this.projectForm.get("projectType");
  // }

  get projectLecturers(): FormArray {
    return this.projectForm.get("projectLecturers") as FormArray;
  }

  get projectExpenses(): FormArray {
    return this.projectForm.get("projectExpenses") as FormArray;
  }

  get participants(): AbstractControl {
    return this.projectForm.get("participants");
  }

  get duration(): AbstractControl {
    return this.projectForm.get("duration");
  }

  get ects(): AbstractControl {
    return this.projectForm.get("ects")
  }

  get crossFaculties(): AbstractControl {
    return this.projectForm.get("crossFaculties");
  }

  get priceForCoursePerDayOverride(): AbstractControl {
    return this.projectForm.get("priceForCoursePerDayOverride");
  }

  get isCourse(): boolean {
    return (this.projectType.value as ProjectType).isCourse
  }

  get otherExpenses(): FormArray {
    return this.projectForm.get("otherExpenses") as FormArray;
  }

  get groupSpecificExpenses(): FormArray {
    return this.projectForm.get("groupSpecificExpenses") as FormArray;
  }

  protected readonly ERole = ERole;
  protected readonly Utils = Utils;
  protected readonly getProjectStateLabel = getProjectStateLabel;
  protected readonly EProjectState = EProjectState;
  protected readonly getProjectStateIconClass = getProjectStateIconClass;
}
