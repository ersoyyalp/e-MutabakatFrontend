import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ToastrService } from 'ngx-toastr';
import { MailParameter } from 'src/app/models/mailParameterModel';
import { MailTemplate } from 'src/app/models/mailTemplateModel';
import { UserOperationClaim } from 'src/app/models/userOperationClaimModel';
import { AuthService } from 'src/app/services/auth.service';
import { MailParameterService } from 'src/app/services/mail-parameter.service';
import { MailTemplateService } from 'src/app/services/mail-template.service';
import { UserOperationClaimService } from 'src/app/services/user-operation-claim.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {

  jwtHelper: JwtHelperService = new JwtHelperService;

  userOperationCliams:UserOperationClaim[] = [];
  // userThemeOption:UserThemeOption = {
  //   sidenavType: "dark",
  //   id:0,
  //   mode:"",
  //   sidenavColor:"primary",
  //   userId:0
  // };
  mailParameterModel: MailParameter = {
    companyId:0,
    email:"",
    id:0,
    password:"",
    port:0,
    smtp:"",
    ssl:false
    };
  mailTemplateModel:MailTemplate = {
    companyId:0,
    type:"Mutabakat",
    id:0,
    value:""
  };

  updateForm:FormGroup;
  updateMailTempleForm:FormGroup

  isAuthenticated:boolean;
  name:string;
  companyName:string;
  currentUrl:string = "";
  companyId:string;
  userId:string;
  editorText:any;

  currencyAccount = false;
  user = false;
  company = false;
  mailParameter = false;
  mailTemplate = false;
  accountReconciliation = false;
  baBsReconciliation = false;

  constructor(
    @Inject("validHatasi") private validHatasi:string,
    private authService:AuthService,
    private toastr: ToastrService,
    private router:Router,
    private userOperationClaimService:UserOperationClaimService,
    private userService:UserService,
    private formBuilder:FormBuilder,
    private mailParameterService:MailParameterService,
    private mailTemplateService:MailTemplateService,
  ) {
  }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.refresh();
    this.userOperationClaimGetList();
    //this.getUserTheme();
    this.createUpdateForm();
    this.getMailTemplate();
  }


  changeClass(url:string){
    this.currentUrl = this.router.routerState.snapshot.url;
    if (url == this.currentUrl) {
     // let color = this.userThemeOption.sidenavColor;
      return "nav-link text-white active bg-gradient-";
    }
    else{
      return "nav-link text-white"
    }
  }

  refresh(){
    if (this.isAuthenticated) {
      let token = localStorage.getItem("token");
      let decode = this.jwtHelper.decodeToken(token);
      let name= Object.keys(decode).filter(x=> x.endsWith("/name"))[0];
      let companyName = Object.keys(decode).filter(x=> x.endsWith("/ispersistent"))[0];
      this.name = decode[name];
      this.companyName = decode[companyName];

      let companyId = Object.keys(decode).filter(x => x.endsWith("/anonymous"))[0];
      let userId = Object.keys(decode).filter(x => x.endsWith("/nameidentifier"))[0];
      this.companyId = decode[companyId];
      this.userId = decode[userId];
    }
  }



  getMailParameter(){
    this.mailParameterService.getById(this.companyId).subscribe((res)=>{
      if (res.data != null) {
        this.mailParameterModel = res.data
      this.updateForm.controls["email"].setValue(res.data.email);
      this.updateForm.controls["password"].setValue(res.data.password);
      this.updateForm.controls["smtp"].setValue(res.data.smtp);
      this.updateForm.controls["port"].setValue(res.data.port);
      this.updateForm.controls["ssl"].setValue(res.data.ssl);
      this.updateForm.controls["id"].setValue(res.data.id);
      }
    },(err)=>{
      console.log(err);
    })
  }

  getMailTemplate(){
    this.mailTemplateService.getByCompanyId(this.companyId).subscribe((res)=>{
      if (res.data != null) {
        this.mailTemplateModel = res.data;
        this.editorText = res.data.value;
      }
    },(err)=>{
      console.log(err);
    })
  }

  updateMailTemplere(){
    this.mailTemplateModel.value = this.editorText;
    this.mailTemplateService.update(this.mailTemplateModel).subscribe((res)=>{
      this.toastr.warning(res.message);
    },(err)=>{
      console.log(err);
    })
  }

  connectionTest(){
    this.mailParameterService.connectionTest(this.companyId).subscribe((res)=>{
      this.toastr.success(res.message);
    },(err)=>{
      console.log(err);
    })
  }


  createUpdateForm(){
    this.updateForm = this.formBuilder.group({
      id: [0,Validators.required],
      email: ["",Validators.required],
      password: [""],
      companyId: [this.companyId,Validators.required],
      smtp: ["",Validators.required],
      port: [0,Validators.required],
      ssl: [false,Validators.required]
    });
  }

  update(){
    if (this.updateForm.valid) {
      let mailParameterModel = Object.assign({}, this.updateForm.value);
      this.mailParameterService.update(mailParameterModel).subscribe((res) => {
        this.toastr.warning(res.message);
        //document.getElementById("closeMailParameterModal").click();
      }, (err) => {
        //console.log(err);
        this.toastr.error(err.error)
      })
    }else{
      this.toastr.error(this.validHatasi);
    }
  }

  logout(){
    localStorage.removeItem("token");
    this.toastr.warning("Başarıyla çıkış yaptınız");
    this.router.navigate(["/login"])
    this.isAuthenticated = false;
  }

  userOperationClaimGetList(){
    this.userOperationClaimService.getlist(this.userId,this.companyId).subscribe((res) => {
      this.userOperationCliams = res.data;
      this.userOperationCliams.forEach(element => {
        if (element.operationClaimName == "Admin") {
          this.currencyAccount = true;
          this.user = true;
          this.company = true;
          this.mailParameter = true;
          this.mailTemplate = true;
          this.accountReconciliation = true;
          this.baBsReconciliation = true;
        }

        if (element.operationClaimName == "CurrencyAccount") {
          this.currencyAccount = true;
        }

        if (element.operationClaimName == "Company") {
          this.company = true;
        }

        if (element.operationClaimName == "User") {
          this.user = true;
        }

        if (element.operationClaimName == "MailParameter") {
          this.mailParameter = true;
        }

        if (element.operationClaimName == "MailTemplate") {
          this.mailTemplate = true;
        }

        if (element.operationClaimName == "AccountReconciliation") {
          this.accountReconciliation = true;
        }

        if (element.operationClaimName == "BaBsReconciliation") {
          this.baBsReconciliation = true;
        }

      });

      //console.log(this.userOperationCliams)
    }, (err) => {
      this.toastr.error("Bir hata ile karşılaştık. Biraz sonra tekrar deneyin")
      //console.log(err)
    })
  }
}
