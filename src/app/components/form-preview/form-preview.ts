import { Component, computed, inject, Injector, signal, untracked } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  Field,
  FieldTree,
  SchemaPath,
  email,
  form,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  required,
  submit,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FieldValue, FormField, FormValues } from '../../models/field';
import { FormService } from '../../services/form.service';
import { FieldRenderer } from '../field-renderer/field-renderer';

function initialValues(fields: readonly FormField[]): FormValues {
  const values: FormValues = {};
  for (const f of fields) {
    values[f.name] = f.type === 'checkbox' || f.type === 'toggle' ? false : '';
  }
  return values;
}

@Component({
  selector: 'app-form-preview',
  imports: [JsonPipe, MatCardModule, MatButtonModule, MatIconModule, FieldRenderer],
  templateUrl: './form-preview.html',
  styleUrl: './form-preview.scss',
})
export class FormPreview {
  private readonly formService = inject(FormService);
  private readonly injector = inject(Injector);

  protected readonly title = this.formService.title;
  protected readonly rows = computed(() => this.formService.rows().filter((r) => r.fields.length));

  /** A live form built from the current schema. Rebuilt whenever the field list changes. */
  protected readonly userForm = computed((): FieldTree<FormValues> => {
    const fields = this.formService.allFields();

    // `form()` creates an internal effect, which Angular forbids while already inside a
    // reactive context (this computed). `untracked` steps outside that context for the
    // duration of the rebuild; `fields` above is still read reactively, so this computed
    // still reruns whenever the schema changes.
    return untracked(() => {
      const model = signal(initialValues(fields));
      return form(
        model,
        (p) => {
          for (const f of fields) {
            const path = p[f.name];
            if (f.required) {
              required(path, { message: `${f.label || 'This field'} is required` });
            }
            if (f.type === 'email') {
              email(path as SchemaPath<string>, { message: 'Enter a valid email address' });
            }
            if (f.minLength != null) {
              minLength(path as SchemaPath<string>, f.minLength, { message: `Minimum ${f.minLength} characters` });
            }
            if (f.maxLength != null) {
              maxLength(path as SchemaPath<string>, f.maxLength, { message: `Maximum ${f.maxLength} characters` });
            }
            if (f.min != null) {
              min(path as SchemaPath<number | string | null>, f.min, { message: `Minimum value is ${f.min}` });
            }
            if (f.max != null) {
              max(path as SchemaPath<number | string | null>, f.max, { message: `Maximum value is ${f.max}` });
            }
            if (f.pattern) {
              pattern(path as SchemaPath<string>, new RegExp(f.pattern), { message: 'Invalid format' });
            }
          }
        },
        { injector: this.injector },
      );
    });
  });

  protected readonly submitted = signal<unknown>(null);

  protected control(name: string): Field<FieldValue> {
    return this.userForm()[name];
  }

  protected async submit() {
    const root = this.userForm();
    const ok = await submit(root, {
      action: async () => {
        this.submitted.set(root().value());
        return undefined;
      },
    });
    if (!ok) this.submitted.set(null);
  }

  protected reset() {
    const root = this.userForm();
    root().value.set(initialValues(this.formService.allFields()));
    root().reset();
    this.submitted.set(null);
  }
}
