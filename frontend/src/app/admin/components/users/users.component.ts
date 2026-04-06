import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { UserService } from "../../../services/user.service";
import { MessageService } from "primeng/api";
import { finalize } from "rxjs";
import { FacultyService } from "../../../services/faculty.service";
import { Faculty } from 'src/app/models/faculty.model';
import { User } from 'src/app/models/user.model';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  createForm: FormGroup;
  visible: boolean;
  submitted: boolean;
  loading: boolean;
  faculty: Faculty;
  nameValue: String;

  constructor(private formBuilder: FormBuilder,
    public userService: UserService,
    public facultyService: FacultyService,
    private messageService: MessageService,
  ) {
  }

  ngOnInit() {
    this.createForm = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email]],
      faculty: [null, Validators.required]
    });
  }

  openDialog() {
    this.visible = true;
  }

  closeDialog() {
    this.visible = false;
    this.createForm.reset();
  }

  submit() {
    this.submitted = true;
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }

    this.loading = true;

    this.userService.create(this.createForm.value.email, this.createForm.value.faculty.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response: User) => {
          console.log('Response:', response);
          this.messageService.add({ severity: 'success', summary: 'Erfolgreich', detail: 'Der Benutzer wurde erstellt.' });
          this.closeDialog();
          this.download(response);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Der Benutzer konnte nicht erstellt werden.' });
        }
      })
  }

  download(user: User) {
    console.log("download startet: " + user)
    var documentDefinition = {
      content: [
        {
          table: {
            headerRows: 1,
            body: [
              [
                { text: 'E-Mail', bold: true },
                { text: 'Passwort', bold: true }
              ],
              [
                user.email,
                user.password
              ]
            ]
          }
        }]
    };
    pdfMake.createPdf(documentDefinition).download(`Zugangsdaten`);
  }

  get email(): AbstractControl {
    return this.createForm.get('email');
  }

  get facultyControl(): AbstractControl {
    return this.createForm.get('faculty');
  }

  selectedFaculty(incomingfaculty: any) {
    this.faculty = incomingfaculty;
  }
}
