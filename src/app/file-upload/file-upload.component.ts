import {Component, Input} from '@angular/core';
import {HttpClient, HttpEventType} from '@angular/common/http';
import {catchError, finalize} from 'rxjs/operators';
import {AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator} from '@angular/forms';
import {noop, of} from 'rxjs';


@Component({
  selector: 'file-upload',
  templateUrl: "file-upload.component.html",
  styleUrls: ["file-upload.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FileUploadComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: FileUploadComponent,
      multi: true
    }
  ] 
})
export class FileUploadComponent implements ControlValueAccessor,Validator {
  constructor(private http: HttpClient){  }
@Input() requiredFileType: string;

fileName: string = '';

fileUploadError = false;
uploadProgress: number;
disabled: boolean = false;

fileUploadSuccess: boolean = false

onChange =  (fileName: string) => {};
onTouched = () => {};
onValidatorChange = () => {};
onClick(fileUpload: HTMLInputElement){
  fileUpload.click();
  this.onTouched();
}

onFileSelected(event){
  const file: File = event.target.files[0];

  if(file){
  this.fileName = file.name;
  const formData = new FormData();
  formData.append("thumbnail", file);

  this.http.post("/api/thumbnail-upload", formData, {
    reportProgress: true,
    observe: 'events'
  }).pipe(
    catchError(err => { 
      this.fileUploadError = true; 
      return of(err);
     }),
     finalize(() => this.uploadProgress = null)
  )
  .subscribe(event =>{
    if(event.type === HttpEventType.UploadProgress){
      this.uploadProgress = Math.round(100 * (event.loaded / event.total));
    }else if(event.type === HttpEventType.Response){
      this.onChange(this.fileName);
      this.fileUploadSuccess = true;
      this.onValidatorChange();
    }
  });

  }
}

writeValue(value: any): void {
    this.fileName = value;
}

registerOnChange(onChange: any): void {
    this.onChange = onChange;
}

registerOnTouched(onTouch: any): void {
    this.onTouched = onTouch;
}

setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;

}
  

registerOnValidatorChange(onValidatorChange: () => void): void {
    this.onValidatorChange = onValidatorChange;

}

validate(control: AbstractControl<any, any>): ValidationErrors | null {
  if(this.fileUploadSuccess){
    return null
  }

  let errors: any = {
    requiredFileType: this.requiredFileType
  };

  if(this.fileUploadError){
    errors.uploadFailed = true;
  }

  return errors;

    
}
}
