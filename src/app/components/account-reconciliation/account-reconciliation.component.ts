import { DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ToastrService } from 'ngx-toastr';
import { AccountReconciliation } from 'src/app/models/accountReconciliationModel';
import { Currency } from 'src/app/models/currency';
import { CurrencyAccount } from 'src/app/models/currencyAccountModel';
import { AccountReconciliationCountDto } from 'src/app/models/dtos/accountReconciliationCountDto';
import { AccountReconciliationDto } from 'src/app/models/dtos/accountReconciliationDto';
import { UserOperationClaim } from 'src/app/models/userOperationClaimModel';
import { AccountReconciliationService } from 'src/app/services/account-reconciliation.service';
import { AuthService } from 'src/app/services/auth.service';
import { CurrencyAccountService } from 'src/app/services/currency-account.service';
import { CurrencyService } from 'src/app/services/currency.service';
import { UserOperationClaimService } from 'src/app/services/user-operation-claim.service';
import { UserService } from 'src/app/services/user.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-account-reconciliation',
  templateUrl: './account-reconciliation.component.html',
  styleUrls: ['./account-reconciliation.component.scss']
})
export class AccountReconciliationComponent implements OnInit {

  @Inject("validHatasi") private validHatasi:string;

  jwtHelper: JwtHelperService = new JwtHelperService;

  userOperationCliams: UserOperationClaim[] = []
  accountReconciliations:AccountReconciliationDto[] = [];
  accountReconciliation:AccountReconciliation;
  accountReconciliationDto:AccountReconciliationDto;
  currencyAccounts:CurrencyAccount[] = [];
  currencies:Currency[] = [];
  accountReconciliationCountDto:AccountReconciliationCountDto = {
    "allReconciliation": 0,
    "succeedReconciliation":0,
    "failReconciliation":0,
    "notResponseReconciliation":0
  };
  // userThemeOption:UserThemeOption = {
  //   sidenavType: "dark",
  //   id:0,
  //   mode:"",
  //   sidenavColor:"primary",
  //   userId:0
  // };


  addForm: FormGroup;
  updateForm:FormGroup;

  isAuthenticated: boolean;
  companyId: string;
  userId: string;
  searchString: string;
  allList: boolean = false;
  activeList: boolean = true;
  passiveList: boolean = false;
  allListCheck: string = "";
  activeListCheck: string = "";
  passiveListCheck: string = "";
  title: string = "Onaylı Cari Mutabakat Listesi";
  filterText: string = "";
  code: string;
  name: string = "";
  address: string = "";
  taxDepartment: string;
  taxIdNumber: string;
  identityNumber: string;
  email: string;
  authorized: string;
  file:string;
  operationAdd = false;
  operationUpdate = false;
  operationDelete = false;
  operationGet = false;
  operationList = false;
  currency:number = 0;
  currencyDebit:number = 0;
  currencyCredit:number = 0;
  resultDate:string = (this.datePipe.transform(Date(), 'yyyy-mm-dd'));
  resultName: string = "";

  constructor(
    private authService: AuthService,
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe,
    private userOperationClaimService:UserOperationClaimService,
    private userService:UserService,
    private accountReconciliationService:AccountReconciliationService,
    private currencyAccountService:CurrencyAccountService,
    private currencyService:CurrencyService
  ) { }

  ngOnInit(): void {
    this.refresh();
    this.userOperationClaimGetList();
    this.getListCurrencyAccount();
    //this.getUserTheme();
    this.getListCurrencies();
    this.getList();
    this.createAddForm();
    this.createUpdateForm();
  }

  refresh() {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      let token = localStorage.getItem("token");
      let decode = this.jwtHelper.decodeToken(token);
      //console.log(decode)
      let companyId = Object.keys(decode).filter(x => x.endsWith("/anonymous"))[0];
      let userId = Object.keys(decode).filter(x => x.endsWith("/nameidentifier"))[0];
      this.companyId = decode[companyId];
      this.userId = decode[userId];
    }
  }

  userOperationClaimGetList(){
    this.userOperationClaimService.getlist(this.userId,this.companyId).subscribe((res) => {
      this.userOperationCliams = res.data;
      this.userOperationCliams.forEach(element => {
        if (element.operationClaimName == "Admin") {
          this.operationAdd = true;
          this.operationUpdate = true;
          this.operationDelete = true;
          this.operationGet = true;
          this.operationList = true;
        }

        if (element.operationClaimName == "CurrencyAccount.Add") {
          this.operationAdd = true;
        }

        if (element.operationClaimName == "CurrencyAccount.Update") {
          this.operationUpdate = true;
        }

        if (element.operationClaimName == "CurrencyAccount.Delete") {
          this.operationDelete = true;
        }

        if (element.operationClaimName == "CurrencyAccount.Get") {
          this.operationGet = true;
        }

        if (element.operationClaimName == "CurrencyAccount.GetList") {
          this.operationList = true;
        }
      });

      //console.log(this.userOperationCliams)
    }, (err) => {
      this.toastr.error("Bir hata ile karşılaştık. Biraz sonra tekrar deneyin")
      //console.log(err)
    })
  }


  getList() {
    this.accountReconciliationService.getlist(this.companyId).subscribe((res) => {
      this.accountReconciliations = res.data;
      this.getCount();
    }, (err) => {
      this.toastr.error("Bir hata ile karşılaştık. Biraz sonra tekrar deneyin")
      //console.log(err)
    })
  }

  getCount() {
    this.accountReconciliationService.getCount(this.companyId).subscribe((res) => {
      this.accountReconciliationCountDto = res.data;
    }, (err) => {
      this.toastr.error("Bir hata ile karşılaştık. Biraz sonra tekrar deneyin")
      //console.log(err)
    })
  }

  exportExcel() {
    let element = document.getElementById('excel-table');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    let title = this.title;
    title = title + ".xlsx";
    XLSX.writeFile(wb, title);
  }

  getListCurrencyAccount() {
    this.currencyAccountService.getlist(this.companyId).subscribe((res) => {
      this.currencyAccounts = res.data;
    }, (err) => {
      this.toastr.error("Bir hata ile karşılaştık. Biraz sonra tekrar deneyin")
      //console.log(err)
    })
  }

  getListCurrencies() {
    this.currencyService.getlist().subscribe((res) => {
      this.currencies = res.data;
    }, (err) => {
      this.toastr.error("Bir hata ile karşılaştık. Biraz sonra tekrar deneyin")
      //console.log(err)
    })
  }

  createAddForm() {
    this.addForm = this.formBuilder.group({
      companyId: [this.companyId, Validators.required],
      currencyAccountId: [0,Validators.required],
      startingDate: [this.datePipe.transform(Date(), 'yyyy-MM-dd'),Validators.required],
      endingDate: [this.datePipe.transform(Date(), 'yyyy-MM-dd'),Validators.required],
      currencyId: [0,Validators.required],
      currencyDebit: [0,Validators.required],
      currencyCredit: [0,Validators.required],
      sendEmailDate: [this.datePipe.transform(Date(), 'yyyy-MM-dd')],
      isSendEmail: false,
      isEmailRead: false,
      emailReadDate: [this.datePipe.transform(Date(), 'yyyy-MM-dd')],
      isResultSucceed: [],
      resultDate: [this.datePipe.transform(Date(), 'yyyy-MM-dd')],
      resultNote: [""],
      guid: [""]
    });
  }

  createUpdateForm() {
    this.updateForm = this.formBuilder.group({
      id:[0],
      companyId: [this.companyId, Validators.required],
      currencyAccountId: [0,Validators.required],
      startingDate: [this.datePipe.transform(Date(), 'yyyy-MM-dd'),Validators.required],
      endingDate: [this.datePipe.transform(Date(), 'yyyy-MM-dd'),Validators.required],
      currencyId: [],
      currencyDebit: [0,Validators.required],
      currencyCredit: [0,Validators.required],
      sendEmailDate: [this.datePipe.transform(Date(), 'yyyy-MM-dd')],
      isSendEmail: false,
      isEmailRead: false,
      emailReadDate: [this.datePipe.transform(Date(), 'yyyy-MM-dd')],
      isResultSucceed: false,
      resultDate: [this.datePipe.transform(Date(), 'yyyy-MM-dd')],
      resultNote: [""],
      guid: [""]
    });
  }

  changeInputClass(text: string) {
    if (text != "") {
      return "input-group input-group-outline is-valid my-3"
    } else {
      return "input-group input-group-outline is-invalid my-3"
    }
  }


  deleteReconciliation(id:number) {
    this.accountReconciliationService.delete(id).subscribe((res) => {
      this.toastr.info(res.message);
      this.getList();
    }, (err) => {
      //console.log(err);
      this.toastr.error(err.error)
    })
  }

  add() {
    if (this.addForm.valid) {
      let accountReconciliationModel = Object.assign({}, this.addForm.value);
      this.accountReconciliationService.add(accountReconciliationModel).subscribe((res) => {
        this.toastr.success(res.message);
        this.getList();
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

  update() {
    if (this.updateForm.valid) {
      let accountReconciliationModel = Object.assign({}, this.updateForm.value);
      this.accountReconciliationService.update(accountReconciliationModel).subscribe((res) => {
        this.toastr.warning(res.message);
        this.getList();
        this.createAddForm();
        document.getElementById("closeUpdateCurrencyReconciliationModal").click();
      }, (err) => {
        //console.log(err);
        this.toastr.error(err.error)
      })
    }else{
      this.toastr.error(this.validHatasi);
    }
  }

  updateResult() {
    this.accountReconciliation.resultDate = this.resultDate;
    this.accountReconciliation.isResultSucceed = true;
    this.accountReconciliation.resultNote = "Sözlü Mutabakat - " + this.resultName;
      this.accountReconciliationService.updateResult(this.accountReconciliation).subscribe((res) => {
        this.toastr.warning(res.message);
        this.getList();
        this.createAddForm();
        document.getElementById("closeResultCurrencyReconciliationModal").click();
      }, (err) => {
        //console.log(err);
        this.toastr.error(err.error)
      })
  }

  currenctReconciliation(accountReconciliation: AccountReconciliation) {
    this.accountReconciliation = accountReconciliation;
    //console.log(this.currencyAccount);
  }

  getListByCheck(text: string) {

    if (text == "allList") {
      this.activeList = false;
      this.passiveList = false;

      this.allListCheck = "checked";
      this.activeListCheck = "";
      this.passiveListCheck = "";

      this.filterText = "";

      this.title = "Tüm Cari Mutabakat Listesi";
    } else if (text == "activeList") {
      this.allList = false;
      this.passiveList = false;

      this.allListCheck = "";
      this.activeListCheck = "checked";
      this.passiveListCheck = "";

      this.filterText = "true";

      this.title = "Onaylı Cari Mutabakat Listesi";
    } else if (text == "passiveList") {
      this.allList = false;
      this.activeList = false;

      this.allListCheck = "";
      this.activeListCheck = "";
      this.passiveListCheck = "checked";

      this.filterText = "false";

      this.title = "Bekleyen Cari Mutabakat Listesi";
    }
  }

  getById(id:number){
    this.accountReconciliationService.getById(id).subscribe((res) => {
      this.accountReconciliation = res.data;
      this.updateForm.controls["id"].setValue(res.data.id);
      this.updateForm.controls["companyId"].setValue(res.data.companyId);
      this.updateForm.controls["currencyAccountId"].setValue(res.data.currencyAccountId);
      this.updateForm.controls["startingDate"].setValue((this.datePipe.transform(res.data.startingDate, 'yyyy-MM-dd')));
      this.updateForm.controls["endingDate"].setValue((this.datePipe.transform(res.data.endingDate, 'yyyy-MM-dd')));
      this.currency = res.data.currencyId;
      this.currencyDebit = res.data.currencyDebit;
      this.currencyCredit = res.data.currencyCredit;
      //this.updateForm.controls["CurrencyId"].setValue(res.data.currencyId);
      // this.updateForm.controls["CurrencyDebit"].setValue(res.data.currencyDebit);
      // this.updateForm.controls["CurrencyCredit"].setValue(res.data.currencyCredit);
      this.updateForm.controls["sendEmailDate"].setValue(res.data.sendEmailDate);
      this.updateForm.controls["isSendEmail"].setValue(res.data.isSendEmail);
      this.updateForm.controls["isEmailRead"].setValue(res.data.isEmailRead);
      this.updateForm.controls["emailReadDate"].setValue(res.data.emailReadDate);
      this.updateForm.controls["isResultSucceed"].setValue(res.data.isResultSucceed);
      this.updateForm.controls["isResultSucceed"].setValue(res.data.isResultSucceed);
      this.updateForm.controls["resultDate"].setValue(res.data.resultDate);
      this.updateForm.controls["resultNote"].setValue(res.data.resultNote);
      this.updateForm.controls["guid"].setValue(res.data.guid);
    }, (err) => {
      //console.log(err);
      this.toastr.error(err.error)
    })
  }

  sendReconciliation(id:number){
    this.accountReconciliationService.sendReconciliationMail(id).subscribe((res) => {
      this.toastr.success(res.message);
    }, (err) => {
      //console.log(err)
      this.toastr.error(err.error)
    })
  }

  getByIdForResult(id:number){
    this.accountReconciliationService.getById(id).subscribe((res) => {
      this.accountReconciliation = res.data;
    }, (err) => {
      this.toastr.error(err.error)
    })
  }

  onChange(event:any){
    this.file = event.target.files[0];
  }

  addFormExcelCurrencyAccount() {
    if (this.file != null || this.file != "") {
      this.accountReconciliationService.addFromExcel(this.file,this.companyId).subscribe((res) => {
        this.toastr.success(res.message);
        this.getList();
        document.getElementById("closeAddFromExcelModal").click();
        this.file = "";
      }, (err) => {
        //console.log(err);
        this.toastr.error(err.error)
      })
    }else{
      this.toastr.error(this.validHatasi);
    }

}
}