import { Directive, TemplateRef, inject } from '@angular/core';

export interface CsAdvancedFilterItemTemplateContext<T = unknown> {
  $implicit: T;
  option: T;
}

@Directive({
  standalone: true,
  selector: 'ng-template[appAdvancedFilterItem]',
})
export class CsAdvancedFilterItemTemplateDirective<T = unknown> {
  readonly templateRef = inject<TemplateRef<CsAdvancedFilterItemTemplateContext<T>>>(TemplateRef);


  static ngTemplateContextGuard<T>(
    _directive: CsAdvancedFilterItemTemplateDirective<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: unknown,
  ): context is CsAdvancedFilterItemTemplateContext<T> {
    return true;
  }
}
