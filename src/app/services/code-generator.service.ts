import { Injectable } from '@angular/core';
import { FormField, FormSchema } from '../models/field';

const esc = (s: string | undefined) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const indent = (text: string, spaces: number) =>
  text
    .split('\n')
    .map((l) => (l ? ' '.repeat(spaces) + l : l))
    .join('\n');

/** The TypeScript type of a field's value in the generated model interface. */
function tsType(f: FormField): string {
  if (f.type === 'checkbox' || f.type === 'toggle') return 'boolean';
  if (f.type === 'date') return 'Date | null';
  return 'string';
}

/** The field's initial value as a TypeScript literal. */
function tsInitial(f: FormField): string {
  if (f.type === 'checkbox' || f.type === 'toggle') return 'false';
  if (f.type === 'date') return 'null';
  return "''";
}

/** Generates a standalone Angular Material component (Signal Forms) from a form schema. */
@Injectable({ providedIn: 'root' })
export class CodeGeneratorService {
  generateHtml(schema: FormSchema): string {
    const rows = schema.rows
      .filter((r) => r.fields.length)
      .map((r) => {
        const fields = r.fields.map((f) => this.fieldHtml(f)).join('\n');
        return `<div class="form-row">\n${indent(fields, 2)}\n</div>`;
      })
      .join('\n');

    return `<form (ngSubmit)="submit()" novalidate class="dynamic-form">
  <h2>${esc(schema.title)}</h2>
${indent(rows, 2)}
  <div class="form-actions">
    <button mat-flat-button type="submit">Submit</button>
  </div>
</form>
`;
  }

  generateTs(schema: FormSchema): string {
    const fields = schema.rows.flatMap((r) => r.fields);

    const modelFields = fields.map((f) => `  ${f.name}: ${tsType(f)};`).join('\n');
    const initialValues = fields.map((f) => `    ${f.name}: ${tsInitial(f)},`).join('\n');

    const signalFormFns = new Set<string>(['form', 'submit', 'FormField']);
    const schemaRules = fields
      .flatMap((f) => this.schemaRules(f, signalFormFns))
      .join('\n');

    const imports = new Set<string>(['MatButtonModule']);
    const matImports = new Map<string, string>([['MatButtonModule', '@angular/material/button']]);
    const need = (name: string, from: string) => {
      imports.add(name);
      matImports.set(name, from);
    };
    for (const f of fields) {
      switch (f.type) {
        case 'select':
          need('MatFormFieldModule', '@angular/material/form-field');
          need('MatSelectModule', '@angular/material/select');
          break;
        case 'radio':
          need('MatRadioModule', '@angular/material/radio');
          break;
        case 'checkbox':
          need('MatCheckboxModule', '@angular/material/checkbox');
          break;
        case 'toggle':
          need('MatSlideToggleModule', '@angular/material/slide-toggle');
          break;
        case 'date':
          need('MatFormFieldModule', '@angular/material/form-field');
          need('MatInputModule', '@angular/material/input');
          need('MatDatepickerModule', '@angular/material/datepicker');
          break;
        default:
          need('MatFormFieldModule', '@angular/material/form-field');
          need('MatInputModule', '@angular/material/input');
      }
    }
    const hasDate = fields.some((f) => f.type === 'date');
    const importLines = [...matImports.entries()]
      .map(([name, from]) => `import { ${name} } from '${from}';`)
      .join('\n');

    return `import { Component, signal } from '@angular/core';
import { ${[...signalFormFns].sort().join(', ')} } from '@angular/forms/signals';
${hasDate ? "import { provideNativeDateAdapter } from '@angular/material/core';\n" : ''}${importLines}

interface GeneratedFormModel {
${modelFields}
}

@Component({
  selector: 'app-generated-form',
  imports: [FormField, ${[...imports].join(', ')}],${hasDate ? '\n  providers: [provideNativeDateAdapter()],' : ''}
  templateUrl: './generated-form.html',
  styleUrl: './generated-form.scss',
})
export class GeneratedForm {
  protected readonly model = signal<GeneratedFormModel>({
${initialValues}
  });

  protected readonly userForm = form(this.model, (p) => {
${indent(schemaRules, 4)}
  });

  protected async submit() {
    await submit(this.userForm, {
      action: async () => {
        console.log(this.userForm().value());
        return undefined;
      },
    });
  }
}
`;
  }

  generateScss(): string {
    return `.dynamic-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 960px;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 8px;

  > * {
    flex: 1 1 200px;
  }
}

.radio-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}
`;
  }

  generateJson(schema: FormSchema): string {
    return JSON.stringify(schema, null, 2);
  }

  /** Signal Forms schema rule lines for one field; adds the functions it uses to `uses`. */
  private schemaRules(f: FormField, uses: Set<string>): string[] {
    const rules: string[] = [];
    if (f.required) {
      uses.add('required');
      rules.push(`required(p.${f.name}, { message: ${JSON.stringify(`${f.label || 'This field'} is required`)} });`);
    }
    if (f.type === 'email') {
      uses.add('email');
      rules.push(`email(p.${f.name}, { message: 'Enter a valid email address' });`);
    }
    if (f.minLength != null) {
      uses.add('minLength');
      rules.push(`minLength(p.${f.name}, ${f.minLength}, { message: ${JSON.stringify(`Minimum ${f.minLength} characters`)} });`);
    }
    if (f.maxLength != null) {
      uses.add('maxLength');
      rules.push(`maxLength(p.${f.name}, ${f.maxLength}, { message: ${JSON.stringify(`Maximum ${f.maxLength} characters`)} });`);
    }
    if (f.min != null) {
      uses.add('min');
      rules.push(`min(p.${f.name}, ${f.min}, { message: ${JSON.stringify(`Minimum value is ${f.min}`)} });`);
    }
    if (f.max != null) {
      uses.add('max');
      rules.push(`max(p.${f.name}, ${f.max}, { message: ${JSON.stringify(`Maximum value is ${f.max}`)} });`);
    }
    if (f.pattern) {
      uses.add('pattern');
      rules.push(`pattern(p.${f.name}, new RegExp(${JSON.stringify(f.pattern)}), { message: 'Invalid format' });`);
    }
    return rules;
  }

  private errorHtml(f: FormField): string {
    return `<mat-error>{{ userForm.${f.name}().errors()[0]?.message }}</mat-error>`;
  }

  private fieldHtml(f: FormField): string {
    const label = esc(f.label);
    const placeholder = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : '';
    const hint = f.hint ? `\n  <mat-hint>${esc(f.hint)}</mat-hint>` : '';
    const opts = f.options ?? [];

    switch (f.type) {
      case 'text':
      case 'email':
      case 'number':
        return `<mat-form-field appearance="outline">
  <mat-label>${label}</mat-label>
  <input matInput type="${f.type}" [formField]="userForm.${f.name}"${placeholder} />${hint}
  ${this.errorHtml(f)}
</mat-form-field>`;
      case 'textarea':
        return `<mat-form-field appearance="outline">
  <mat-label>${label}</mat-label>
  <textarea matInput rows="${f.rows ?? 3}" [formField]="userForm.${f.name}"${placeholder}></textarea>${hint}
  ${this.errorHtml(f)}
</mat-form-field>`;
      case 'select':
        return `<mat-form-field appearance="outline">
  <mat-label>${label}</mat-label>
  <mat-select [formField]="userForm.${f.name}"${placeholder}>
${opts.map((o) => `    <mat-option value="${esc(o.value)}">${esc(o.label)}</mat-option>`).join('\n')}
  </mat-select>${hint}
  ${this.errorHtml(f)}
</mat-form-field>`;
      case 'date':
        return `<mat-form-field appearance="outline">
  <mat-label>${label}</mat-label>
  <input matInput [matDatepicker]="${f.name}Picker" [formField]="userForm.${f.name}"${placeholder} />
  <mat-datepicker-toggle matIconSuffix [for]="${f.name}Picker" />
  <mat-datepicker #${f.name}Picker />${hint}
  ${this.errorHtml(f)}
</mat-form-field>`;
      case 'radio':
        return `<div class="radio-field">
  <label>${label}${f.required ? ' *' : ''}</label>
  <mat-radio-group [formField]="userForm.${f.name}">
${opts.map((o) => `    <mat-radio-button value="${esc(o.value)}">${esc(o.label)}</mat-radio-button>`).join('\n')}
  </mat-radio-group>
</div>`;
      case 'checkbox':
        return `<mat-checkbox [formField]="userForm.${f.name}">${label}</mat-checkbox>`;
      case 'toggle':
        return `<mat-slide-toggle [formField]="userForm.${f.name}">${label}</mat-slide-toggle>`;
    }
  }
}
