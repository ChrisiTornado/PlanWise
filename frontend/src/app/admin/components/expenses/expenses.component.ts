import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import { ExpenseService } from 'src/app/services/expense.service';
import {MessageService} from "primeng/api";
import {finalize} from "rxjs";

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent {
  createForm: FormGroup;
  visible: boolean;
  submitted: boolean;
  loading: boolean;

  constructor(private formBuilder: FormBuilder,
              public expenseService: ExpenseService,
              private messageService: MessageService) {
  }

  ngOnInit() {
    this.createForm = this.formBuilder.group({
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
  }

  submit() {
    this.submitted = true;
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }

    this.loading = true;

    this.expenseService.create(this.name.value)
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
}
