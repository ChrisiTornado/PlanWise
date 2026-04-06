import {Component, Input} from '@angular/core';
import {finalize} from "rxjs";
import {Expense} from "../../../../models/expense.model";
import {ExpenseService} from "../../../../services/expense.service";
import {MessageService} from "primeng/api";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-update-expenses',
  templateUrl: './update-expenses.component.html',
  styleUrls: ['./update-expenses.component.scss']
})
export class UpdateExpensesComponent {
  @Input() expense: Expense;
  loading: boolean;

  createForm: FormGroup;
  visible: boolean;
  submitted: boolean;

  constructor(private expenseService: ExpenseService, private formBuilder: FormBuilder,
    private messageService: MessageService) {
  }

  ngOnInit() {
    this.createForm = this.formBuilder.group({
      name: [this.expense.name, [Validators.required]]
    });
  }

  openDialog() {
    this.visible = true;
    this.createForm = this.formBuilder.group({
      name: [this.expense.name, [Validators.required]]
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
    console.log(this.name.value)
    console.log(this.expense.id)

    this.expenseService.update(this.expense.id, this.name.value)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Erfolgreich', detail: 'Der Aufwand wurde aktualisiert.' });
          this.closeDialog();
        },
        error: (err) => {
          console.log(err);
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Der Aufwand konnte nicht aktualisiert werden.' });
        }
      })
  }

  get name(): AbstractControl {
    return this.createForm.get('name');
  }
}
