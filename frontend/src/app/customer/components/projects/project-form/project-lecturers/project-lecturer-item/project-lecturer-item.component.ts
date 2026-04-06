import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {Project} from "../../../../../../models/project.model";
import {AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Dropdown, DropdownModule} from "primeng/dropdown";
import {AuthService} from "../../../../../../services/auth/auth.service";
import {LecturerService} from "../../../../../../services/lecturer.service";
import {ProjectLecturer} from "../../../../../../models/project-lecturer.model";
import {InputSwitchModule} from "primeng/inputswitch";
import {InputNumberModule} from "primeng/inputnumber";
import {ButtonDirective} from "primeng/button";
import {Ripple} from "primeng/ripple";
import {AsyncPipe, NgIf} from "@angular/common";
import {Faculty} from "../../../../../../models/faculty.model";
import {ERole} from "../../../../../../models/user.model";
import {AutoFocus} from "primeng/autofocus";
import {InputTextModule} from "primeng/inputtext";
import {Lecturer} from "../../../../../../models/lecturer.model";

@Component({
  selector: 'app-project-lecturer-item',
  standalone: true,
  templateUrl: './project-lecturer-item.component.html',
  imports: [
    ReactiveFormsModule,
    InputSwitchModule,
    DropdownModule,
    InputNumberModule,
    ButtonDirective,
    Ripple,
    NgIf,
    AutoFocus,
    InputTextModule,
    AsyncPipe
  ],
  styleUrls: ['./project-lecturer-item.component.scss']
})
export class ProjectLecturerItemComponent implements OnInit, AfterViewInit{
  @Input() i: number;
  @Input() project: Project;
  @Input() projectForm: FormGroup;
  @Input() projectLecturerControl: AbstractControl
  @Input() projectLecturer: ProjectLecturer
  @Input() submitted: boolean;

  @Input() dropDownLecturers: any[];

  @ViewChild('lecturersDropdown') lecturersDropdown: Dropdown

  useOtherSelected: boolean = false
  faculty: Faculty;

  constructor(private formBuilder: FormBuilder,
              public authService: AuthService,
              public lecturerService: LecturerService) {
  }

  ngOnInit() {
    this.faculty = this.authService.user.role == ERole.ADMIN ? this.project.faculty : this.authService.user.faculty

    if(this.authService.user.role == ERole.ADMIN) {
      this.lecturer.valueChanges.subscribe({
        next: (lecturer: Lecturer) => {
          if(!lecturer)
            return

          if(this.daily.value) {
            this.dailyRateOverride.setValue(this.projectLecturer && this.lecturer.value.id == this.projectLecturer.lecturer.id ? (this.projectLecturer.dailyRateOverride ?? lecturer.dailyRate) : lecturer.dailyRate)
          } else {
            this.hourlyRateOverride.setValue(this.projectLecturer && this.lecturer.value.id == this.projectLecturer.lecturer.id ? (this.projectLecturer.hourlyRateOverride ?? lecturer.hourlyRate) : lecturer.hourlyRate)
          }
        }
      })

      this.daily.valueChanges.subscribe({
        next: (daily) => {
          if(!this.lecturer.value)
            return

          if (daily) {
            this.hourlyRateOverride.setValue(null)
            this.dailyRateOverride.setValue((this.projectLecturer?.dailyRateOverride && this.lecturer.value.id == this.projectLecturer.lecturer.id) ? this.projectLecturer.dailyRateOverride : this.lecturer.value.dailyRate)
          } else {
            this.dailyRateOverride.setValue(null)
            this.hourlyRateOverride.setValue((this.projectLecturer?.hourlyRateOverride && this.lecturer.value.id == this.projectLecturer.lecturer.id) ? this.projectLecturer.hourlyRateOverride : this.lecturer.value.hourlyRate)
          }
        }
      })
    }
  }

  get availableLecturers(): any[] {
    const selectedIds = (this.projectForm.get('projectLecturers') as FormArray)
      .controls
      .map((control, index) => index === this.i ? null : control.get('lecturer')?.value?.id)
      .filter(id => id != null);

    if (!this.crossFaculty) {
      return (this.dropDownLecturers ?? []).filter(lecturer => selectedIds.indexOf(lecturer.id) === -1);
    }

    return (this.dropDownLecturers ?? []).map(group => ({
      ...group,
      items: group.items.filter(lecturer => selectedIds.indexOf(lecturer.id) === -1)
    })).filter(group => group.items.length > 0);
  }

  // Workaround
  ngAfterViewInit() {
    if(this.project) {
      this.lecturersDropdown.updateModel(this.getProjectLecturerValue())
    }
  }

  getProjectLecturerValue() {
    if(!this.projectLecturer?.lecturer)
      return null

    if(this.crossFaculty) {
      this.useOtherSelected = true
      let dropdownGroup = this.dropDownLecturers.find(d => d.value.id == this.projectLecturer.lecturer.faculty.id);
      return dropdownGroup?.items.find(dl => dl.id == this.projectLecturer.lecturer.id);
    } else {
      return this.dropDownLecturers.find(dl => this.projectLecturer.lecturer.id == dl.id);
    }
  }

  removeProjectLecturer() {
    (this.projectForm.get('projectLecturers') as FormArray).removeAt(this.i);
  }

  get crossFaculty(): boolean {
    return this.projectForm.get('crossFaculty').value;
  }

  get lecturer(): AbstractControl {
    return this.projectLecturerControl.get("lecturer");
  }

  get daily(): AbstractControl {
    return this.projectLecturerControl.get("daily");
  }

  get hours(): AbstractControl {
    return this.projectLecturerControl.get("hours");
  }

  get hourlyRateOverride(): AbstractControl {
    return this.projectLecturerControl.get("hourlyRateOverride");
  }

  get dailyRateOverride(): AbstractControl {
    return this.projectLecturerControl.get("dailyRateOverride");
  }

  get selectedLecturer(): Lecturer | null {
    return this.lecturer.value ?? null;
  }

  protected readonly ERole = ERole;
}
