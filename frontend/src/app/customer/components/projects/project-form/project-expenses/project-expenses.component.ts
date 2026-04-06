import {Component, Input, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {filter, take} from "rxjs";
import {ExpenseService} from "../../../../../services/expense.service";
import {AuthService} from "../../../../../services/auth/auth.service";
import {Project} from "../../../../../models/project.model";
import {ProjectExpense} from "../../../../../models/project-expense.model";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {DropdownModule} from "primeng/dropdown";
import {InputNumberModule} from "primeng/inputnumber";
import {ButtonDirective} from "primeng/button";
import {Ripple} from "primeng/ripple";

@Component({
  selector: 'app-project-expenses',
  standalone: true,
  templateUrl: './project-expenses.component.html',
  imports: [
    ReactiveFormsModule,
    NgForOf,
    DropdownModule,
    AsyncPipe,
    InputNumberModule,
    ButtonDirective,
    Ripple,
    NgIf
  ],
  styleUrls: ['./project-expenses.component.scss']
})
export class ProjectExpensesComponent implements OnInit{
  // This component will be used when creating a new project, but also when editing an existing project
  // Therefore there needs to be a distinction, which is done via the "project" object, which gets passed from the outside component (either the new-project or the edit-project component)
  @Input() project: Project; // currently not relevant
  @Input() projectForm: FormGroup;
  @Input() submitted: boolean;

  constructor(private formBuilder: FormBuilder,
              public authService: AuthService,
              public expenseService: ExpenseService) {
  }

  ngOnInit() {
    this.initializeExpenses();
  }

  initializeExpenses() {
    if (this.project) {
      // not needed until there is no editing of projects
      this.project.expenses.forEach((projectExpenses: ProjectExpense) => {
        let expense = this.expenseService.models.find(e => e.id == projectExpenses.expense.id);
        this.projectExpenses.push(this.formBuilder.group({
          id: [projectExpenses.id],
          expense: [expense, [Validators.required]],
          costs: [projectExpenses.costs, [Validators.required, Validators.min(1)]]
        }))
      })
    } else {
      this.projectExpenses.push(this.newProjectExpenseFormGroup());
    }
  }

  newProjectExpenseFormGroup(): FormGroup {
    return this.formBuilder.group({
      id: [null],
      expense: [this.expenseService.models[0], [Validators.required]],
      costs: [null, [Validators.required, Validators.min(1)]]
    })
  }

  addProjectExpense() {
    setTimeout(() => {
      this.projectExpenses.push(this.newProjectExpenseFormGroup());
    });
  }

  availableExpenses(i: number) {
    const selectedIds = this.projectExpenses.controls
      .map((control, index) => index === i ? null : control.get('expense')?.value?.id)
      .filter(id => id != null);

    return (this.expenseService.models ?? []).filter(expense => selectedIds.indexOf(expense.id) === -1);
  }

  removeProjectExpense(i: number) {
    this.projectExpenses.removeAt(i);
  }

  get projectExpenses(): FormArray {
    return this.projectForm.get("projectExpenses") as FormArray;
  }

  costs(i: number): AbstractControl {
    return this.projectExpenses.at(i).get("costs");
  }
}
