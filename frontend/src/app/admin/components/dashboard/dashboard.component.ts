import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ConfirmationService, MegaMenuItem} from "primeng/api";
import {NavigationEnd, Router} from "@angular/router";
import {filter} from "rxjs";
import {AuthService} from "../../../services/auth/auth.service";
import {ProjectService} from "../../../services/project.service";
import {ExpenseService} from "../../../services/expense.service";
import {LecturerService} from "../../../services/lecturer.service";
import {FacultyService} from "../../../services/faculty.service";
import {ProjectTypeService} from "../../../services/project-type.service";
import {ProjectCategoryService} from 'src/app/services/project-category.service';
import {CompanyService} from 'src/app/services/company.service';
import {NotificationService} from "../../../services/notification.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  items: MegaMenuItem[] | undefined
  services = [
    this.projectService,
    this.facultyService,
    this.expenseService,
    this.lecturerService,
    this.projectTypeService,
    this.projectCategoryService,
    this.notificationService,
    this.companyService
  ]

  constructor(public authService: AuthService,
              private projectService: ProjectService,
              private expenseService: ExpenseService,
              private lecturerService: LecturerService,
              private projectTypeService: ProjectTypeService,
              private facultyService: FacultyService,
              private notificationService: NotificationService,
              private projectCategoryService: ProjectCategoryService,
              private companyService: CompanyService,
              private confirmationService: ConfirmationService,
              private router: Router) {
  }

  ngOnInit() {
    this.services.forEach((service: any) => {
      service.getAll()
    })

    this.items = [
      {
        label: 'Users',
        icon: 'pi pi-fw pi-users',
        routerLink: 'users'
      },
      {
        label: 'Fakultäten',
        icon: 'pi pi-fw pi-building',
        routerLink: 'faculties'
      },
      {
        label: 'Vortragende',
        icon: 'pi pi-fw pi-users',
        routerLink: 'lecturer'
      },
      {
        label: 'Kunden',
        icon: 'pi pi-fw pi-address-book',
        routerLink: 'companies'
      },
      {
        label: 'Aufwände',
        icon: 'pi pi-fw pi-folder-open',
        routerLink: 'expenses'
      },
      {
        label: 'Projektarten',
        icon: 'pi pi-fw pi-folder',
        routerLink: 'projectCategory'
      },
      {
        label: 'Projekte',
        icon: 'pi pi-fw pi-briefcase',
        routerLink: 'projects'
      },
      {
        label: 'Benachrichtigungen',
        icon: 'pi pi-fw pi-envelope',
        routerLink: 'notifications'
      },
      {
        label: 'Logout',
        icon: 'pi pi-fw pi-sign-out',
        command: () => this.logout()
      }
    ];

    this.setActiveNavigationItem(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.setActiveNavigationItem(event.urlAfterRedirects));

    this.authService.logoutLoading$.subscribe(
      {
        next: (loading) => {
          let logoutItem = {
            label: 'Logout',
            icon: loading ? 'pi pi-spin pi-spinner' : 'pi pi-fw pi-sign-out',
            command: () => loading ? {} : this.logout()
          }
          if(loading) {
            this.items = this.items.map(i => i.label == 'Logout' ? logoutItem : i)
          }
        }
      }
    )
  }

  logout() {
    this.confirmationService.confirm({
      header: 'Logout bestätigen',
      message: 'Möchtest du dich wirklich ausloggen?',
      icon: 'pi pi-sign-out',
      accept: () => {
        this.authService.logoutLoading = true
        this.services.forEach((service: any) => {
          service.reset()
        })
        this.authService.logout();
      }
    });
  }

  private setActiveNavigationItem(url: string) {
    this.items = this.items?.map(item => ({
      ...item,
      styleClass: this.isNavigationItemActive(item, url) ? 'navigation-item-active' : undefined
    }));
  }

  private isNavigationItemActive(item: MegaMenuItem, url: string): boolean {
    const link = Array.isArray(item.routerLink) ? item.routerLink.join('/') : item.routerLink;

    switch (link) {
      case 'users':
        return url.startsWith('/admin/users');
      case 'faculties':
        return url.startsWith('/admin/faculties') || url.startsWith('/admin/faculty-details');
      case 'lecturer':
        return url.startsWith('/admin/lecturer');
      case 'companies':
        return url.startsWith('/admin/companies') || url.startsWith('/admin/company-details');
      case 'expenses':
        return url.startsWith('/admin/expenses');
      case 'projectCategory':
        return url.startsWith('/admin/projectCategory');
      case 'projects':
        return url.startsWith('/admin/projects');
      case 'notifications':
        return url.startsWith('/admin/notifications');
      default:
        return false;
    }
  }
}

