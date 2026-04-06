import {Component, Input} from '@angular/core';
import {finalize} from "rxjs";
import {ProjectCategory} from "src/app/models/project-category.model";
import {ProjectCategoryService} from "src/app/services/project-category.service";
import {MessageService} from "primeng/api";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";

import { ProjectType } from 'src/app/models/project-type.model';
import { ProjectTypeService } from 'src/app/services/project-type.service';

@Component({
  selector: 'app-update-project-category',
  templateUrl: './update-project-category.component.html',
  styleUrl: './update-project-category.component.scss'
})
export class UpdateProjectCategoryComponent {
  @Input() projectType: ProjectType;
  loading: boolean;

  createForm: FormGroup;
  visible: boolean;
  submitted: boolean;
  isCourse: boolean;

  yesNoOptions = [
    { label: 'Ja', value: true },
    { label: 'Nein', value: false }
  ];

  constructor(private formBuilder: FormBuilder,
    private messageService: MessageService, private projectTypeService: ProjectTypeService) {
  }

  ngOnInit() {
    this.isCourse = this.projectType.isCourse;
    this.createForm = this.formBuilder.group({
      name: [this.projectType.name, [Validators.required]],
      code: [this.projectType.code, [Validators.required]],
      isCourse: [this.projectType.isCourse, [Validators.required]]
    });
  }

  openDialog() {
    this.visible = true;
    this.createForm = this.formBuilder.group({
      name: [this.projectType.name, [Validators.required]],
      code: [this.projectType.code, [Validators.required]],
    });
  }

  closeDialog() {
    this.visible = false;
    this.createForm.reset();
  }

  submit() {
    this.submitted = true;
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }

    this.loading = true;
    this.projectTypeService.update(this.projectType.id, this.name.value, this.code.value, this.isCourse)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Erfolgreich', detail: 'Die Auftragsart wurde aktualisiert.' });
          this.closeDialog();
        },
        error: (err) => {
          console.log(err);
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Die Auftragsart‚ konnte nicht aktualisiert werden.' });
        }
      })
  }

  get name(): AbstractControl {
    return this.createForm.get('name');
  }

  get code(): AbstractControl {
    return this.createForm.get('code');
  }

  onSelectionChange(option: any) {
    this.isCourse = option.value;
  }
}
