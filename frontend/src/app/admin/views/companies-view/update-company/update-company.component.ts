import {Component, Input, ViewChild} from '@angular/core';
import {finalize} from "rxjs";
import { Company } from "src/app/models/company.model";
import { CompanyService } from "src/app/services/company.service";
import {MessageService} from "primeng/api";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-update-company',
  templateUrl: './update-company.component.html',
  styleUrl: './update-company.component.scss'
})

export class UpdateCompanyComponent {
  @Input() company: Company;
  loading: boolean;

  createForm: FormGroup;
  visible: boolean;
  submitted: boolean;
  selectedImage: File = null;
  @ViewChild('fileUpload') fileUpload: any;

  constructor(private companyService: CompanyService, private formBuilder: FormBuilder,
    private messageService: MessageService) {
  }

  ngOnInit() {
    this.createForm = this.formBuilder.group({
      image: [null],
      name: [this.company.name, [Validators.required]]
    });
  }

  openDialog() {
    this.visible = true;
    // this.createForm = this.formBuilder.group({
    //   image: [this.company.image],
    //   name: [this.company.name, [Validators.required]]
    // });
  }

  closeDialog() {
    this.visible = false;
    this.createForm.reset();
    this.selectedImage = null;
    this.fileUpload.clear();
  }

  onFileSelected(event: any): void {
    const file = event.files[0]; // Korrekte Zugriffsmethode für PrimeNG
    this.selectedImage = file;
    this.createForm.patchValue({ image: file });
    this.createForm.get('image').updateValueAndValidity();
}

  submit() {
    this.submitted = true;
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }

    this.loading = true;
    const formData = new FormData();
    if(this.createForm.get('image').value)
      formData.append('file', this.createForm.get('image').value);
    this.companyService.update(this.company.id, formData ,this.name.value)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Erfolgreich', detail: 'Der Kunde wurde aktualisiert.' });
          this.closeDialog();
        },
        error: (err) => {
          console.log(err);
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Der Kunde konnte nicht aktualisiert werden.' });
        }
      })
  }

  get image(): AbstractControl {
    return this.createForm.get('image');
  }

  get name(): AbstractControl {
    return this.createForm.get('name');
  }
}
