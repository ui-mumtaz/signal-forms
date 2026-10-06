import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField } from '../../models/field';
import { FieldRenderer } from './field-renderer';

function makeField(overrides: Partial<FormField> = {}): FormField {
  return { id: '1', type: 'text', name: 'field1', label: 'Field', required: false, ...overrides };
}

@Component({
  imports: [FieldRenderer],
  template: `<app-field-renderer [field]="field" />`,
})
class HostWithoutControl {
  field: FormField = makeField();
}

describe('FieldRenderer (detached, no bound control)', () => {
  it('renders without a control input, for the editor canvas', () => {
    const fixture = TestBed.createComponent(HostWithoutControl);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
  });

  it('shows the required marker on choice fields when the field definition is required', () => {
    const fixture = TestBed.createComponent(HostWithoutControl);
    fixture.componentInstance.field = makeField({ type: 'checkbox', required: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('*');
  });

  it('renders every field type without throwing', () => {
    const types: FormField['type'][] = ['text', 'email', 'number', 'textarea', 'select', 'radio', 'checkbox', 'toggle', 'date'];
    for (const type of types) {
      const fixture = TestBed.createComponent(HostWithoutControl);
      fixture.componentInstance.field = makeField({ type, options: [{ label: 'A', value: 'a' }] });
      expect(() => fixture.detectChanges()).not.toThrow();
    }
  });
});
