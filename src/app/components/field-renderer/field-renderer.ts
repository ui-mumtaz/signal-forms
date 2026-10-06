import { Component, computed, inject, input, Injector, signal } from '@angular/core';
import { Field, FormField as FormFieldDirective, form, required } from '@angular/forms/signals';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FieldValue, FormField as FormFieldDef } from '../../models/field';

/** Renders one Material control for a field definition. Used by both the editor canvas and the preview. */
@Component({
  selector: 'app-field-renderer',
  imports: [
    FormFieldDirective,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './field-renderer.html',
  styleUrl: './field-renderer.scss',
})
export class FieldRenderer {
  private readonly injector = inject(Injector);

  readonly field = input.required<FormFieldDef>();
  /** Field to bind to. When omitted (editor canvas) a detached, schema-less field is used. */
  readonly control = input<Field<FieldValue>>();

  /** A detached field used only on the editor canvas, where there is no live form to bind to.
   * Its only rule mirrors the field definition's `required` flag, so the canvas still shows the
   * same required marker as the live preview. */
  private readonly fallback = form(
    signal<FieldValue>(''),
    (p) => required(p, { when: () => this.field().required }),
    { injector: this.injector },
  );
  protected readonly ctrl = computed(() => this.control() ?? this.fallback);
  protected readonly state = computed(() => this.ctrl()());

  protected readonly errorMessage = computed(() => this.state().errors()[0]?.message ?? 'Invalid value');
}
