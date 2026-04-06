import {Component, Input} from '@angular/core';
import {ProjectExpense} from "../../../../../models/project-expense.model";
import {ProjectLecturer} from "../../../../../models/project-lecturer.model";
import {OtherExpense} from "../../../../../models/other-expense.model";
import { GroupSpecificExpense } from 'src/app/models/group-specific-expense.model';
import Utils from "../../../../../shared/utils";
import {CurrencyPipe, DecimalPipe, NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-calculations',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgIf,
    NgForOf,
    DecimalPipe
  ],
  templateUrl: './calculations.component.html',
  styleUrl: './calculations.component.scss'
})
export class CalculationsComponent {
  @Input() projectExpenses: ProjectExpense[];
  @Input() projectLecturers: ProjectLecturer[];
  @Input() otherExpenses: OtherExpense[];
  @Input() groupSpecificExpenses: GroupSpecificExpense[];
  @Input() participants: number;
  @Input() duration: number;
  @Input() priceForCoursePerDay: number;
  @Input() showRevenue: boolean = true;
  @Input() showAdminCosts: boolean = false;
  protected readonly Utils = Utils;

  get variableOtherExpenses(): OtherExpense[] {
    return (this.otherExpenses ?? []).filter(oe => oe.perParticipant)
  }

  get variableOtherExpensesCosts(): number {
    return Utils.getVariableOtherExpenseCosts(this.otherExpenses, this.participants)
  }

  get variableOtherExpensesCostsPerParticipant(): number {
    return Utils.getVariableOtherExpenseCostsPerParticipant(this.otherExpenses)
  }

  get fixOtherExpenses(): OtherExpense[] {
    return (this.otherExpenses ?? []).filter(oe => !oe.perParticipant)
  }

  get fixOtherExpensesCosts(): number {
    return Utils.getFixedOtherExpenseCosts(this.otherExpenses)
  }

  get variableGroupSpecificExpenses(): GroupSpecificExpense[] {
    return (this.groupSpecificExpenses ?? []).filter(ge => ge.perParticipant)
  }

  get variableGroupSpecificExpensesCosts(): number {
    return Utils.getVariableGroupSpecificExpenseCosts(this.groupSpecificExpenses, this.participants)
  }

  get variableGroupSpecificExpensesCostsPerParticipant(): number {
    return Utils.getVariableGroupSpecificExpenseCostsPerParticipant(this.groupSpecificExpenses)
  }

  get fixGroupSpecificExpenses(): GroupSpecificExpense[] {
    return (this.groupSpecificExpenses ?? []).filter(ge => !ge.perParticipant)
  }

  get fixGroupSpecificExpensesCosts(): number {
    return Utils.getFixedGroupSpecificExpenseCosts(this.groupSpecificExpenses)
  }

  get revenue(): number {
    return Utils.getRevenue(this.participants, this.duration, this.priceForCoursePerDay)
  }

  get revenuePerParticipant(): number {
    return (this.duration ?? 0) * (this.priceForCoursePerDay ?? 0)
  }

  get hasRevenueInputs(): boolean {
    return (this.participants ?? 0) > 0 && (this.duration ?? 0) > 0 && (this.priceForCoursePerDay ?? 0) > 0
  }

  get allFixedCosts(): number {
    return Utils.getFixedProjectCosts(this.projectLecturers, this.projectExpenses, this.otherExpenses, this.groupSpecificExpenses)
  }

  get totalGroupSpecificCosts(): number {
    return Utils.getGroupSpecificExpenseCosts(this.groupSpecificExpenses, this.participants)
  }

  get projectExpensesCosts(): number {
    return Utils.getExpenseCosts(this.projectExpenses)
  }

  get lecturersCosts(): number {
    return Utils.getLecturersCosts(this.projectLecturers)
  }

  get fixedOtherCosts(): number {
    return this.fixOtherExpensesCosts + this.fixGroupSpecificExpensesCosts
  }

  get fixedProjectCostsWithoutLecturers(): number {
    return this.projectExpensesCosts + this.fixedOtherCosts
  }

  get variableCostsPerParticipant(): number {
    return Utils.getVariableProjectCostsPerParticipant(this.otherExpenses, this.groupSpecificExpenses)
  }

  get variableCostsTotal(): number {
    return this.variableCostsPerParticipant * (this.participants ?? 0)
  }

  get contributionMarginPerParticipant(): number {
    return this.revenuePerParticipant - this.variableCostsPerParticipant
  }

  get totalCosts(): number {
    return Utils.calculateProjectCosts(this.projectLecturers, this.projectExpenses, this.otherExpenses, this.participants, this.groupSpecificExpenses)
  }

  get profit(): number {
    return this.revenue - this.totalCosts
  }

  get breakEvenParticipants(): number | null {
    return Utils.getBreakEvenParticipants(this.projectLecturers, this.projectExpenses, this.otherExpenses, this.groupSpecificExpenses, this.duration, this.priceForCoursePerDay)
  }

  get hasProfit(): boolean {
    return this.profit >= 0
  }

  get resultStepLabel(): string {
    if (this.showAdminCosts)
      return this.showRevenue ? '6.' : '5.'

    return this.showRevenue ? '4.' : '3.'
  }

  lecturerRate(projectLecturer: ProjectLecturer): number {
    if (!projectLecturer)
      return 0

    return projectLecturer.daily
      ? projectLecturer.dailyRateOverride ?? projectLecturer.lecturer?.dailyRate ?? 0
      : projectLecturer.hourlyRateOverride ?? projectLecturer.lecturer?.hourlyRate ?? 0
  }

  lecturerUnit(projectLecturer: ProjectLecturer): string {
    return projectLecturer?.daily ? 'Tagessatz' : 'Stundensatz'
  }

  lecturerCosts(projectLecturer: ProjectLecturer): number {
    return (projectLecturer?.hours ?? 0) * this.lecturerRate(projectLecturer)
  }

  variableExpenseTotal(expense: OtherExpense | GroupSpecificExpense): number {
    return (expense?.costs ?? 0) * (this.participants ?? 0)
  }

  get db1(): number {
    return this.revenue - this.variableOtherExpensesCosts
  }

  get dbU1(): number {
    return this.db1 / this.revenue * 100
  }

  get db2(): number {
    return this.db1 - this.allFixedCosts
  }

  get dbU2(): number {
    return this.db2 / this.revenue * 100
  }

  get db3(): number {
    return this.db2 - this.totalGroupSpecificCosts
  }

  get dbU3(): number {
    return this.db3 / this.revenue * 100
  }
}
