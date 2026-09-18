import { Pipe, PipeTransform } from '@angular/core'

@Pipe({ name: 'titleCase', standalone: true })
export class TitleCasePipe implements PipeTransform {
  transform(value: string): string {
    return value
  }
}
