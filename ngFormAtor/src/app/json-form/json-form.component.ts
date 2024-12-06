// import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';

// interface JsonFormValidators {
//   min?: number;
//   max?: number;
//   required?: boolean;
//   requiredTrue?: boolean;
//   email?: boolean;
//   minLength?: boolean;
//   maxLength?: boolean;
//   pattern?: string;
//   nullValidator?: boolean;
// }

// interface JsonFormControlOptions {
//   min?: string;
//   max?: string;
//   step?: string;
//   icon?: string;
// }

// interface JsonFormControls {
//   name: string;
//   label: string;
//   value: any;
//   type: string;
//   options?: JsonFormControlOptions;
//   required: boolean;
//   validators: JsonFormValidators;
// }

// export interface JsonFormData {
//   controls: JsonFormControls[];
// }

// @Component({
//   selector: 'app-json-form',
//   imports: [CommonModule, ReactiveFormsModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   templateUrl: './json-form.component.html',
//   styleUrls: ['./json-form.component.css'],
// })
// export class JsonFormComponent {
//   @Input() set jsonFormData(value: JsonFormData) {
//     this.jsonFormDataSignal.set(value);
//     if (value) {
//       this.createForm(value.controls); // Trigger form creation whenever input changes
//     }
//   }

//   public readonly jsonFormDataSignal = signal<JsonFormData | null>(null);
//   private myFormSignal = signal<FormGroup>(new FormGroup({}));


//   myForm = computed(() => this.myFormSignal());

//   constructor(private fb: FormBuilder) { }

//   createForm(controls: JsonFormControls[]) {
//     const formControls: { [key: string]: any } = {};
//     for (const control of controls) {
//       const validatorsToAdd = [];

//       for (const [key, value] of Object.entries(control.validators)) {
//         switch (key) {
//           case 'min':
//             validatorsToAdd.push(Validators.min(value));
//             break;
//           case 'max':
//             validatorsToAdd.push(Validators.max(value));
//             break;
//           case 'required':
//             if (value) {
//               validatorsToAdd.push(Validators.required);
//             }
//             break;
//           case 'email':
//             if (value) {
//               validatorsToAdd.push(Validators.email);
//             }
//             break;
//           case 'minLength':
//             validatorsToAdd.push(Validators.minLength(value));
//             break;
//           case 'maxLength':
//             validatorsToAdd.push(Validators.maxLength(value));
//             break;
//           case 'pattern':
//             validatorsToAdd.push(Validators.pattern(value));
//             break;
//           case 'nullValidator':
//             if (value) {
//               validatorsToAdd.push(Validators.nullValidator);
//             }
//             break;
//           default:
//             break;
//         }
//       }

//       if (control.type === 'checkbox' || control.type === 'toggle') {
//         // Convert 'true' string to boolean true
//         const isChecked = control.value;
//         control.value = isChecked;
//       }

//       formControls[control.name] = this.fb.control(control.value, validatorsToAdd);
//     }

//     const formGroup = this.fb.group(formControls);

//     this.myFormSignal.set(formGroup);
//   }

//   checkBoxChange(event: any, controlName: string) {
//     const form = this.myFormSignal(); // Get the FormGroup from the signal
//     if (form) {
//       // Set the value of the specific FormControl
//       const isChecked = event.target.checked;
//       form.get(controlName)?.setValue(isChecked);
//     }
//   }

//   rangeChange(event: any) {
//     console.log(event.target.value);
//   }

//   onSubmit() {
//     const form = this.myFormSignal();
//     if (form) {
//       console.log('Form valid: ', form.valid);
//       console.log('Form values: ', form.value);
//     }
//   }
// }

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface JsonFormValidators {
  min?: number;
  max?: number;
  required?: boolean;
  requiredTrue?: boolean;
  email?: boolean;
  minLength?: boolean;
  maxLength?: boolean;
  pattern?: string;
  nullValidator?: boolean;
}

interface JsonFormControlOptions {
  min?: string;
  max?: string;
  step?: string;
  icon?: string;
}

interface JsonFormControls {
  name: string;
  label: string;
  value: any;
  type: string; // 'text', 'checkbox', 'array', 'nested', etc.
  controlType: "nested" | "array";
  options?: JsonFormControlOptions;
  required: boolean;
  validators: JsonFormValidators;
  controls?: JsonFormControls[]; // For nested or array fields
}

export interface JsonFormData {
  controls: JsonFormControls[];
}

@Component({
  selector: 'app-json-form',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './json-form.component.html',
  styleUrls: ['./json-form.component.css'],
})
export class JsonFormComponent {
  @Input() set jsonFormData(value: JsonFormData) {
    this.jsonFormDataSignal.set(value);
    if (value) {
      this.createForm(value.controls); // Trigger form creation whenever input changes
    }
  }

  public readonly jsonFormDataSignal = signal<JsonFormData | null>(null);
  private myFormSignal = signal<FormGroup>(new FormGroup({}));

  myForm = computed(() => this.myFormSignal());

  constructor(private fb: FormBuilder) { }

  createForm(controls: JsonFormControls[]) {
    const formControls: { [key: string]: any } = {};

    controls.forEach(control => {
      const validatorsToAdd = this.getValidators(control.validators);

      if (control.controlType === 'array') {
        // Create a FormArray for the 'array' type controls
        formControls[control.name] = this.fb.array(
          control.value.map((item: any) => this.createControl(item, control.validators)) // Create FormControl for each array item
        );
      } else if (control.controlType === 'nested') {
        // Nested form group
        formControls[control.name] = this.createNestedForm(control.controls as JsonFormControls[], validatorsToAdd);
      } else {
        // Regular control
        formControls[control.name] = this.fb.control(control.value, validatorsToAdd);
      }
    });

    const formGroup = this.fb.group(formControls);
    this.myFormSignal.set(formGroup);
  }

  // Recursive creation of form control for nested fields
  createNestedForm(controls: JsonFormControls[], validators: any[] = []) {
    const nestedFormControls: { [key: string]: any } = {};
    controls.forEach(control => {
      const validatorsToAdd = this.getValidators(control.validators);
      if (control.controlType === 'array') {
        nestedFormControls[control.name] = this.fb.array(control.value.map((item: any) => this.createControl(item, control.validators)));
      } else if (control.controls) {
        nestedFormControls[control.name] = this.createNestedForm(control.controls, validatorsToAdd);

        console.log(nestedFormControls)
      } else {
        nestedFormControls[control.name] = this.fb.control(control.value, validatorsToAdd);
      }
    });
    return this.fb.group(nestedFormControls);
  }

  // Create form control with the appropriate validators
  createControl(value: any, validators: JsonFormValidators) {
    const validatorsToAdd = this.getValidators(validators);
    return this.fb.control(value, validatorsToAdd);
  }

  // Convert JsonFormValidators to Angular Validators
  getValidators(validators: JsonFormValidators): any[] {
    const validatorsToAdd = [];
    if (validators && typeof validators === 'object') {
      for (const [key, value] of Object.entries(validators)) {
        switch (key) {
          case 'min':
            validatorsToAdd.push(Validators.min(value));
            break;
          case 'max':
            validatorsToAdd.push(Validators.max(value));
            break;
          case 'required':
            if (value) {
              validatorsToAdd.push(Validators.required);
            }
            break;
          case 'email':
            if (value) {
              validatorsToAdd.push(Validators.email);
            }
            break;
          case 'minLength':
            validatorsToAdd.push(Validators.minLength(value));
            break;
          case 'maxLength':
            validatorsToAdd.push(Validators.maxLength(value));
            break;
          case 'pattern':
            validatorsToAdd.push(Validators.pattern(value));
            break;
          case 'nullValidator':
            if (value) {
              validatorsToAdd.push(Validators.nullValidator);
            }
            break;
          default:
            break;
        }
      }
    }
    return validatorsToAdd;
  }

  checkBoxChange(event: any, controlName: string) {
    const form = this.myFormSignal(); // Get the FormGroup from the signal
    if (form) {
      // Set the value of the specific FormControl
      const isChecked = event.target.checked;
      form.get(controlName)?.setValue(isChecked);
    }
  }

  rangeChange(event: any) {
    console.log(event.target.value);
  }

  onSubmit() {
    const form = this.myFormSignal();
    if (form) {
      console.log('Form valid: ', form.valid);
      console.log('Form values: ', form.value);
    }
  }

  get formArray() {
    const form = this.myFormSignal();
    return form ? form.get('yourArrayFieldName') as FormArray : null;
  }
}
