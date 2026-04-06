import {Component, OnInit} from '@angular/core';
import {Message, MessageService} from "primeng/api";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../../services/auth/auth.service";
import {finalize} from "rxjs";
import {ERole} from "../../../models/user.model";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading: boolean;
  submitted: boolean = false;

  constructor(private fb: FormBuilder,
              private authService: AuthService,
              private messageService: MessageService,
              private route: ActivatedRoute,
              private router: Router) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, Validators.required]
    })
    if(this.authService.user?.passwordReset)
      this.email.setValue(this.authService.user.email)
  }

  submit() {
    this.submitted = true;
    if(this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService.login(
      this.email.value,
      this.password.value
    )
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        {
          next: (user) => {
            if(user.passwordReset) {
              let route = user.role == ERole.ADMIN ? '/admin' : '/customer';
              this.router.navigate([route]).then(() => {
                setTimeout(() => {
                    this.messageService.add({
                      severity: 'success',
                      summary: 'Erfolgreich',
                      detail: 'Der Login war erfolgreich.'
                    });
                });
              });
            } else {
              this.router.navigate(['/auth/change-password']).then(() => {
                setTimeout(() => {
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Neues Passwort benötigt',
                    detail: 'Ein neues Passwort muss gesetzt werden.'
                  });
                });
              });
            }
          },
          error: (e) => {
            if(e.error.message == "Credentials incorrect")
              this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Das Passwort ist inkorrekt.' });
            else if (e.error.message == "The selected email is invalid.")
              this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Ungültige E-Mail-Adresse.' });
            else
              this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Es ist ein Fehler aufgetreten.' });
          }
        }
      )
  }

  resetPasswort() {
    this.router.navigate(['/auth/email-reset']).then(() => {
    });
  }

  get email(): AbstractControl {
    return this.loginForm.get('email');
  }
  get password(): AbstractControl {
    return this.loginForm.get('password');
  }

}
