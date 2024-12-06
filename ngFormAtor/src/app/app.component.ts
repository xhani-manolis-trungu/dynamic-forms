import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JsonFormComponent, JsonFormData } from "./json-form/json-form.component";
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, JsonFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true
})
export class AppComponent {
  title = 'ngFormAtor';

  public formData!: JsonFormData;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.http.get('../assets/my-form.json').subscribe((formData: any) => {
      this.formData = formData as JsonFormData;
    })
  }
}
