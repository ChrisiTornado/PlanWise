import {Component, Input} from '@angular/core';
import {finalize} from "rxjs";
import {ConfirmationService} from "primeng/api";
import {Expense} from 'src/app/models/expense.model';
import {ExpenseService} from 'src/app/services/expense.service';

@Component({
  selector: 'app-delete-expense',
  template: `
  <p-button icon="pi pi-trash" styleClass="p-button-danger" [loading]="loading" (click)="delete()"></p-button>
`,
  styles: []
})
export class DeleteExpenseComponent {
  @Input() expense: Expense;
  loading: boolean;

  constructor(private expenseService: ExpenseService,
              private confirmationService: ConfirmationService) {
  }

  delete() {
    this.confirmationService.confirm({
      header: 'Aufwand löschen',
      message: `Möchtest du "${this.expense.name}" wirklich löschen?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.expenseService.delete(this.expense.id)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
            }
          })
      }
    });
  }
}
