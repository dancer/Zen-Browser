#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use tauri::Manager;

#[tauri::command]
async fn navigate_to(window: tauri::Window, url: String) -> Result<(), String> {
    window.eval(&format!(r#"
        document.getElementById('webview-container').innerHTML = `
            <webview 
                src="{}" 
                style="width:100%; height:100%; border:none;"
                allowfullscreen="false"
            ></webview>
        `;
    "#, url)).map_err(|e| e.to_string())
}

#[tauri::command]
async fn refresh_page(window: tauri::Window) -> Result<(), String> {
    window.eval(r#"
        document.querySelector('#webview-container webview')?.reload();
    "#).map_err(|e| e.to_string())
}

#[tauri::command]
async fn go_back(window: tauri::Window) -> Result<(), String> {
    window.eval(r#"
        document.querySelector('#webview-container webview')?.back();
    "#).map_err(|e| e.to_string())
}

#[tauri::command]
async fn go_forward(window: tauri::Window) -> Result<(), String> {
    window.eval(r#"
        document.querySelector('#webview-container webview')?.forward();
    "#).map_err(|e| e.to_string())
}

pub fn init() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            navigate_to,
            refresh_page,
            go_back,
            go_forward
        ])
        .setup(|app| {
            let main_window = app.get_window("main").unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
