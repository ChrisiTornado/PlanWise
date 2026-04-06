import {ProjectLecturer} from "../models/project-lecturer.model";
import {ProjectExpense} from "../models/project-expense.model";
import {OtherExpense} from "../models/other-expense.model";
import { GroupSpecificExpense } from "../models/group-specific-expense.model";

export default class Utils {
  static calculateProjectCosts(projectLecturers: ProjectLecturer[], projectExpenses: ProjectExpense[], otherExpenses: OtherExpense[], 
    participants: number, groupSpecificExpenses: GroupSpecificExpense[]) {
    return this.getLecturersCosts(projectLecturers) + this.getExpenseCosts(projectExpenses) + (otherExpenses ? this.getOtherExpenseCosts(otherExpenses, participants) : 0)
      + (groupSpecificExpenses ? this.getGroupSpecificExpenseCosts(groupSpecificExpenses, participants) : 0)
  }

  static getExpenseCosts(projectExpenses: ProjectExpense[]): number {
    let costs = 0;
    (projectExpenses ?? []).forEach(projectExpense => {
      costs += projectExpense.costs ?? 0;
    });
    return costs
  }

  static getOtherExpenseCosts(otherExpenses: OtherExpense[], participants: number): number {
    return this.getFixedOtherExpenseCosts(otherExpenses) + this.getVariableOtherExpenseCosts(otherExpenses, participants)
  }

  static getGroupSpecificExpenseCosts(groupSpecificExpenses: GroupSpecificExpense[], participants: number): number {
    return this.getFixedGroupSpecificExpenseCosts(groupSpecificExpenses) + this.getVariableGroupSpecificExpenseCosts(groupSpecificExpenses, participants)
  }

  static getLecturersCosts(projectLecturers: ProjectLecturer[]): number {
    let costs = 0;
    (projectLecturers ?? []).forEach(projectLecturer => {
      if (!projectLecturer?.lecturer)
        return

      let dailyRate = projectLecturer.dailyRateOverride ?? projectLecturer.lecturer.dailyRate
      let hourlyRate = projectLecturer.hourlyRateOverride ?? projectLecturer.lecturer.hourlyRate
      costs += (projectLecturer.hours ?? 0) * (projectLecturer.daily ? dailyRate : hourlyRate);
    });
    return costs
  }

  static getFixedOtherExpenseCosts(otherExpenses: OtherExpense[]): number {
    return (otherExpenses ?? [])
      .filter(oe => !oe.perParticipant)
      .reduce((costs, oe) => costs + (oe.costs ?? 0), 0)
  }

  static getVariableOtherExpenseCostsPerParticipant(otherExpenses: OtherExpense[]): number {
    return (otherExpenses ?? [])
      .filter(oe => oe.perParticipant)
      .reduce((costs, oe) => costs + (oe.costs ?? 0), 0)
  }

  static getVariableOtherExpenseCosts(otherExpenses: OtherExpense[], participants: number): number {
    return this.getVariableOtherExpenseCostsPerParticipant(otherExpenses) * (participants ?? 0)
  }

  static getFixedGroupSpecificExpenseCosts(groupSpecificExpenses: GroupSpecificExpense[]): number {
    return (groupSpecificExpenses ?? [])
      .filter(ge => !ge.perParticipant)
      .reduce((costs, ge) => costs + (ge.costs ?? 0), 0)
  }

  static getVariableGroupSpecificExpenseCostsPerParticipant(groupSpecificExpenses: GroupSpecificExpense[]): number {
    return (groupSpecificExpenses ?? [])
      .filter(ge => ge.perParticipant)
      .reduce((costs, ge) => costs + (ge.costs ?? 0), 0)
  }

  static getVariableGroupSpecificExpenseCosts(groupSpecificExpenses: GroupSpecificExpense[], participants: number): number {
    return this.getVariableGroupSpecificExpenseCostsPerParticipant(groupSpecificExpenses) * (participants ?? 0)
  }

  static getFixedProjectCosts(projectLecturers: ProjectLecturer[], projectExpenses: ProjectExpense[], otherExpenses: OtherExpense[], groupSpecificExpenses: GroupSpecificExpense[]): number {
    return this.getLecturersCosts(projectLecturers)
      + this.getExpenseCosts(projectExpenses)
      + this.getFixedOtherExpenseCosts(otherExpenses)
      + this.getFixedGroupSpecificExpenseCosts(groupSpecificExpenses)
  }

  static getVariableProjectCostsPerParticipant(otherExpenses: OtherExpense[], groupSpecificExpenses: GroupSpecificExpense[]): number {
    return this.getVariableOtherExpenseCostsPerParticipant(otherExpenses)
      + this.getVariableGroupSpecificExpenseCostsPerParticipant(groupSpecificExpenses)
  }

  static getRevenue(participants: number, duration: number, priceForCoursePerDay: number): number {
    return (participants ?? 0) * (duration ?? 0) * (priceForCoursePerDay ?? 0)
  }

  static getProfit(projectLecturers: ProjectLecturer[], projectExpenses: ProjectExpense[], otherExpenses: OtherExpense[], groupSpecificExpenses: GroupSpecificExpense[], participants: number, duration: number, priceForCoursePerDay: number): number {
    return this.getRevenue(participants, duration, priceForCoursePerDay)
      - this.calculateProjectCosts(projectLecturers, projectExpenses, otherExpenses, participants, groupSpecificExpenses)
  }

  static getBreakEvenParticipants(projectLecturers: ProjectLecturer[], projectExpenses: ProjectExpense[], otherExpenses: OtherExpense[], groupSpecificExpenses: GroupSpecificExpense[], duration: number, priceForCoursePerDay: number): number | null {
    const revenuePerParticipant = (duration ?? 0) * (priceForCoursePerDay ?? 0)
    const variableCostsPerParticipant = this.getVariableProjectCostsPerParticipant(otherExpenses, groupSpecificExpenses)
    const contributionMarginPerParticipant = revenuePerParticipant - variableCostsPerParticipant

    if (contributionMarginPerParticipant <= 0)
      return null

    return Math.max(
      1,
      Math.ceil(this.getFixedProjectCosts(projectLecturers, projectExpenses, otherExpenses, groupSpecificExpenses) / contributionMarginPerParticipant)
    )
  }
}
