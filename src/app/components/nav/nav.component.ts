import { Component, OnInit } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {
  jwtHelper: JwtHelperService = new JwtHelperService;

  isAuthenticated:boolean;
  name:string;
  companyName:string;


  constructor(
    private authService:AuthService,
  ) { }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.refresh();
  }

  refresh(){
    if (this.isAuthenticated) {
      let token = localStorage.getItem("token");
      let decode = this.jwtHelper.decodeToken(token);
      let name = Object.keys(decode).filter(x => x.endsWith("/name"))[0];
      let companyName = Object.keys(decode).filter(x => x.endsWith("/ispersistent"))[0];
      this.name = decode[name];
      this.companyName = decode[companyName];
      //console.log(decode);
    }
  }

}
