import { DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ToastrService } from 'ngx-toastr';
import { Company } from 'src/app/models/companyModel';
import { UserOperationClaim } from 'src/app/models/userOperationClaimModel';
import { AuthService } from 'src/app/services/auth.service';
import { CompanyService } from 'src/app/services/company.service';
import { UserOperationClaimService } from 'src/app/services/user-operation-claim.service';
import { UserService } from 'src/app/services/user.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss']
})
export class CompanyComponent implements OnInit {

  jwtHelper:JwtHelperService = new JwtHelperService;

  userOperationCliams:UserOperationClaim[] = [];
  companies:Company[] = [];
  company:Company;
  // userThemeOption:UserThemeOption = {
  //   sidenavType: "dark",
  //   id:0,
  //   mode:"",
  //   sidenavColor:"primary",
  //   userId:0
  // };

  addForm:FormGroup;
  updateForm:FormGroup;

  operationAdd = false;
  operationUpdate = false;
  operationDelete = false;
  operationGet = false;
  operationList = false;
  allList: boolean = false;
  activeList: boolean = true;
  passiveList: boolean = false;
  allListCheck: string = "";
  activeListCheck: string = "";
  passiveListCheck: string = "";
  filterText:string = "true";
  title:string = "Aktif Şirket Listesi";
  searchString:string = "";
  isAuthenticated:boolean = false;
  companyId:string;
  userId:string;
  name:string = "";
  address:string = "";
  taxDepartment:string;
  taxIdNumber:string;
  identityNumber:string;

  constructor(
    @Inject("validHatasi") private validHatasi:string,
    private authService:AuthService,
    private toastr:ToastrService,
    private userOperationClaimService:UserOperationClaimService,
    private companyService:CompanyService,
    private formBuilder:FormBuilder,
    private datePipe:DatePipe,
    private userService:UserService,
  ) { }

  ngOnInit(): void {
    this.refresh();
    this.userOperationClaimGetList();
    //this.getUserTheme();
    this.getUserCompanyList();
    this.createAddForm();
    this.createUpdateForm();
  }

  refresh() {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      let token = localStorage.getItem("token");
      let decode = this.jwtHelper.decodeToken(token);
      let companyId = Object.keys(decode).filter(x => x.endsWith("/anonymous"))[0];
      let userId = Object.keys(decode).filter(x => x.endsWith("/nameidentifier"))[0];
      this.companyId = decode[companyId];
      this.userId = decode[userId];
    }
  }

  // getUserTheme(){
  //   this.userService.getTheme(this.userId).subscribe((res)=>{
  //    // this.userThemeOption = res.data
  //   },(err)=>{
  //     console.log(err);
  //   })
  // }


  createAddForm(){
    this.addForm = this.formBuilder.group({
      name: ["",Validators.required],
      address: ["",Validators.required],
      taxDepartment: [""],
      taxIdNumber: [""],
      identityNumber: [""],
      isActive: [true],
      addedAt: [this.datePipe.transform(Date(), 'yyyy-MM-dd')],
      userId: [this.userId]
    });
  }

  createUpdateForm(){
    this.updateForm = this.formBuilder.group({
      id: [0,Validators.required],
      name: ["",Validators.required],
      address: ["",Validators.required],
      taxDepartment: [""],
      taxIdNumber: [""],
      identityNumber: [""],
      isActive: [true],
      addedAt: [this.datePipe.transform(Date(), 'yyyy-MM-dd')],
    });
  }

  changeInputClass(text: string) {
    if (text != "") {
      return "input-group input-group-outline is-valid my-3"
    } else {
      return "input-group input-group-outline is-invalid my-3"
    }
  }


  userOperationClaimGetList(){
    this.userOperationClaimService.getlist(this.userId.toString(),this.companyId).subscribe((res) => {
      this.userOperationCliams = res.data;
      this.userOperationCliams.forEach(element => {
        if (element.operationClaimName == "Admin") {
          this.operationAdd = true;
          this.operationUpdate = true;
          this.operationDelete = true;
          this.operationGet = true;
          this.operationList = true;
        }

        if (element.operationClaimName == "Company.Add") {
          this.operationAdd = true;
        }

        if (element.operationClaimName == "Company.Update") {
          this.operationUpdate = true;
        }

        if (element.operationClaimName == "Company.Delete") {
          this.operationDelete = true;
        }

        if (element.operationClaimName == "Company.Get") {
          this.operationGet = true;
        }

        if (element.operationClaimName == "Company.GetList") {
          this.operationList = true;
        }
      });

      //console.log(this.userOperationCliams)
    }, (err) => {
      this.toastr.error("Bir hata ile karşılaştık. Biraz sonra tekrar deneyin")
      //console.log(err)
    })
  }

  add() {
    if (this.addForm.valid) {
      let companyModel = Object.assign({}, this.addForm.value);
      this.companyService.addCompany(companyModel).subscribe((res) => {
        this.toastr.success(res.message);
        this.getUserCompanyList();
        this.createAddForm();
        document.getElementById("closeModal").click();
      }, (err) => {
        //console.log(err);
        this.toastr.error(err.error)
      })
    }else{
      this.toastr.error(this.validHatasi);
    }
  }

  update(){
    if (this.updateForm.valid) {
      let companyModel = Object.assign({}, this.updateForm.value);
      this.companyService.updateCompany(companyModel).subscribe((res) => {
        this.toastr.success(res.message);
        this.getUserCompanyList();
        this.createUpdateForm();
        document.getElementById("closeUpdateModal").click();
      }, (err) => {
        //console.log(err);
        this.toastr.error(err.error)
      })
    }else{
      this.toastr.error(this.validHatasi);
    }
  }

  exportExcel() {
    let element = document.getElementById('excel-table');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    let title = "Şirket Listesi";
    title = title + ".xlsx";
    XLSX.writeFile(wb, title);
  }

  getListByCheck(text: string) {

    if (text == "allList") {
      this.activeList = false;
      this.passiveList = false;

      this.allListCheck = "checked";
      this.activeListCheck = "";
      this.passiveListCheck = "";

      this.filterText = "";

      this.title = "Tüm Şirketi Listesi";
    } else if (text == "activeList") {
      this.allList = false;
      this.passiveList = false;

      this.allListCheck = "";
      this.activeListCheck = "checked";
      this.passiveListCheck = "";

      this.filterText = "true";

      this.title = "Aktif Şirketi Listesi";
    } else if (text == "passiveList") {
      this.allList = false;
      this.activeList = false;

      this.allListCheck = "";
      this.activeListCheck = "";
      this.passiveListCheck = "checked";

      this.filterText = "false";

      this.title = "Pasif Şirketi Listesi";
    }
  }

  getUserCompanyList(){
    this.companyService.getCompanyListByUserid(this.userId).subscribe((res) => {

      this.companies = res.data;
    }, (err) => {
      this.toastr.error("Bir hata ile karşılaştık. Biraz sonra tekrar deneyin")
    })
  }

  getCompany(companyId:number){
    this.companyService.getCompany(companyId).subscribe((res) => {
      this.company = res.data;
      //console.log(res.data)
      this.updateForm.controls["id"].setValue(res.data.id);
      this.updateForm.controls["name"].setValue(res.data.name);
      this.updateForm.controls["address"].setValue(res.data.address);
      this.updateForm.controls["taxDepartment"].setValue(res.data.taxDepartment);
      this.updateForm.controls["taxIdNumber"].setValue(res.data.taxIdNumber);
      this.updateForm.controls["identityNumber"].setValue(res.data.identityNumber);
    }, (err) => {
      this.toastr.error("Bir hata ile karşılaştık. Biraz sonra tekrar deneyin")
    })
  }

  changeStatusCompany(company:Company){
 
    this.companyService.changeStatusCompany(company).subscribe((res) => {
      this.getUserCompanyList();
      this.toastr.warning(res.message)
    }, (err) => {
      this.toastr.error("Bir hata ile karşılaştık. Biraz sonra tekrar deneyin")
    })
  }



}
