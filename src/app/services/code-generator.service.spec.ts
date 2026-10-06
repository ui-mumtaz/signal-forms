import ts from 'typescript';
import { FormSchema } from '../models/field';
import { CodeGeneratorService } from './code-generator.service';

const schema: FormSchema = {
  title: 'Contact Us',
  rows: [
    {
      id: 'r1',
      fields: [
        { id: 'f1', type: 'text', name: 'firstName', label: 'First name', required: true, minLength: 2, pattern: '^[A-Z].*' },
        { id: 'f2', type: 'email', name: 'email', label: 'Email', required: true },
        { id: 'f3', type: 'number', name: 'age', label: 'Age', required: false, min: 18, max: 120 },
        { id: 'f4', type: 'textarea', name: 'message', label: 'Message', required: true, maxLength: 500, rows: 4 },
        {
          id: 'f5',
          type: 'select',
          name: 'topic',
          label: 'Topic',
          required: true,
          options: [{ label: 'Sales', value: 'sales' }],
        },
        { id: 'f6', type: 'date', name: 'preferredDate', label: 'Preferred date', required: false },
        {
          id: 'f7',
          type: 'radio',
          name: 'contactMethod',
          label: 'Contact me by',
          required: true,
          options: [{ label: 'Email', value: 'email' }],
        },
        { id: 'f8', type: 'checkbox', name: 'terms', label: 'I agree to the terms', required: true },
        { id: 'f9', type: 'toggle', name: 'newsletter', label: 'Subscribe to newsletter', required: false },
      ],
    },
  ],
};

function transpileCheck(code: string) {
  const result = ts.transpileModule(code, {
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.Preserve },
  });
  return result.diagnostics ?? [];
}

describe('CodeGeneratorService', () => {
  const service = new CodeGeneratorService();

  it('generates syntactically valid TypeScript for every field type', () => {
    const code = service.generateTs(schema);
    const diagnostics = transpileCheck(code);
    if (diagnostics.length) {
      const messages = diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n');
      throw new Error(`Generated TS has syntax errors:\n${messages}\n\n${code}`);
    }
  });

  it('imports only the Signal Forms validators actually used, plus form/submit/FormField', () => {
    const code = service.generateTs(schema);
    expect(code).toContain("from '@angular/forms/signals'");
    for (const fn of ['form', 'submit', 'FormField', 'required', 'email', 'minLength', 'maxLength', 'min', 'max', 'pattern']) {
      expect(code).toContain(fn);
    }
    expect(code).not.toContain('ReactiveFormsModule');
    expect(code).not.toContain('FormBuilder');
    expect(code).not.toContain('Validators.');
  });

  it('escapes a pattern containing a forward slash without breaking the regex literal', () => {
    const withSlash: FormSchema = {
      title: 'Slash test',
      rows: [{ id: 'r1', fields: [{ id: 'f1', type: 'text', name: 'code', label: 'Code', required: false, pattern: '^a/b$' }] }],
    };
    const code = service.generateTs(withSlash);
    expect(transpileCheck(code)).toEqual([]);
    expect(code).toContain('new RegExp(');
  });

  it('binds every field with [formField] and reads error messages from the schema, not hardcoded text', () => {
    const html = service.generateHtml(schema);
    expect(html).toContain('[formField]="userForm.firstName"');
    expect(html).toContain('[formField]="userForm.terms"');
    expect(html).toContain('userForm.firstName().errors()[0]?.message');
    expect(html).not.toContain('formControlName');
    expect(html).not.toContain('is required</mat-error>');
  });

  it('generateJson round-trips the schema', () => {
    expect(JSON.parse(service.generateJson(schema))).toEqual(schema);
  });
});
