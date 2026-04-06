import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import { ProjectCategoryService } from 'src/app/services/project-category.service';
import {MessageService} from "primeng/api";
import {finalize} from "rxjs";
import { ProjectTypeService } from 'src/app/services/project-type.service';

@Component({
  selector: 'app-project-category',
  templateUrl: './project-category.component.html',
  styleUrl: './project-category.component.scss'
})
export class ProjectCategoryComponent {
  createForm: FormGroup;
  visible: boolean;
  submitted: boolean;
  loading: boolean;
  isCourse: boolean;

  yesNoOptions = [
    { label: 'Ja', value: true },
    { label: 'Nein', value: false }
  ];

  constructor(private formBuilder: FormBuilder,
              public projectTypeService: ProjectTypeService,
              private messageService: MessageService) {
  }

  ngOnInit() {
    this.createForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      code: [null, [Validators.required]]
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

    console.log(this.isCourse)
    this.projectTypeService.create(this.name.value, this.code.value, this.isCourse)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Erfolgreich', detail: 'Aufwand wurde erstellt.' });
          this.closeDialog();
        },
        error: (err) => {
          console.log(err);
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Der Aufwand konnte nicht erstellt.' });
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
