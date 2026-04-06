import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CompanyService } from 'src/app/services/company.service';
import { MessageService } from "primeng/api";
import { finalize } from "rxjs";

@Component({
  selector: 'app-companies',
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.scss'
})
export class CompaniesComponent implements OnInit {
  createForm: FormGroup;
  visible: boolean;
  submitted: boolean;
  loading: boolean;
  @ViewChild('fileUpload') fileUpload: any;

  selectedImage: File = null;

  constructor(private formBuilder: FormBuilder,
              public companyService: CompanyService,
              private messageService: MessageService) { }

  ngOnInit() {
    this.createForm = this.formBuilder.group({
      image: [null, [Validators.required]],
      name: [null, [Validators.required]]
    });
  }

  openDialog() {
    this.visible = true;
  }

  closeDialog() {
    this.visible = false;
    this.submitted = false;
    this.createForm.reset();
    this.fileUpload.clear();
  }

  // Funktion zum Handhaben der Bildauswahl
  onFileSelected(event: any): void {
    const file = event.files[0]; // Korrekte Zugriffsmethode für PrimeNG
    this.selectedImage = file;
    this.createForm.patchValue({ image: file });
    this.createForm.get('image').updateValueAndValidity();
}

  submit() {
    this.submitted = true;
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }

    if (!this.selectedImage) {
      this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Bitte ein Bild auswählen.' });
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('file', this.createForm.get('image').value);

    this.companyService.create(formData, this.name.value) // Passiere FormData an den Service
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Erfolgreich', detail: 'Unternehmen wurde erstellt.' });
          this.closeDialog();
        },
        error: (err) => {
          console.log(err);
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Unternehmen konnte nicht erstellt werden.' });
        }
      });
  }

  getImageSrc(): string {
    const value = this.image?.value;
    if (!value) return '';
    return value.startsWith('data:image') ? value : 'data:image/png;base64,' + value;
  }

  get name(): AbstractControl {
    return this.createForm.get('name');
  }

  get image(): AbstractControl {
    return this.createForm.get('image');
  }
}
