import {Component, Input, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NotificationService} from "../../../../services/notification.service";
import {Notification} from "../../../../models/notification.model";
import {InputSwitchModule} from "primeng/inputswitch";
import {InputTextModule} from "primeng/inputtext";
import {Button} from "primeng/button";
import {NgIf} from "@angular/common";
import {finalize} from "rxjs";
import {MessageService} from "primeng/api";
import {ToastModule} from "primeng/toast";

@Component({
  selector: 'app-notification-form',
  standalone: true,
  imports: [
    InputSwitchModule,
    ReactiveFormsModule,
    InputTextModule,
    Button,
    NgIf,
    ToastModule
  ],
  templateUrl: './notification-form.component.html',
  styleUrl: './notification-form.component.scss'
})
export class NotificationFormComponent implements OnInit {
  @Input() notification: Notification
  formGroup: FormGroup
  loading: boolean
  submitted: boolean = false

  constructor(private formBuilder: FormBuilder,
              private messageService: MessageService,
              public notificationService: NotificationService) {}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      email: [this.notification.email, [Validators.required, Validators.email]],
      activated: [this.notification.activated]
    })
  }

  formChanges() {
    return this.notification.email != this.email.value || this.notification.activated != this.activated.value
  }

  update() {
    this.submitted = true
    if (this.formGroup.invalid) { this.formGroup.markAllAsTouched(); return; }

    this.loading = true
    this.notificationService.update(
      this.notification.id,
      this.email.value,
      this.activated.value
    )
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (notification: Notification) => {
          this.messageService.add({severity: 'success', summary: 'Erfolgreich', detail: 'Die Änderungen wurden gespeichert.'});
        },
        error: err => this.messageService.add({severity: 'error', summary: 'Fehler', detail: 'Die Änderungen konnten nicht gespeichert werden.'})
      })
  }

  get email(): AbstractControl {
    return this.formGroup.get('email')
  }

  get activated(): AbstractControl {
    return this.formGroup.get('activated')
  }
}
