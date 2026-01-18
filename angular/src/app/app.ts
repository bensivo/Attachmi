import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  protected readonly title = signal('attachmi');


  async onClickButton() {
    const res = await (window as any).electronAPI.sendMessage('Hello from Angular!');
    console.log('Response from Electron:', res);
  }
}
