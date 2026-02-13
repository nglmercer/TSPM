use std::env;
use std::io::prelude::*;
use std::net::TcpListener;
use std::process;
use std::thread;
use std::time::Duration;

fn main() {
    let _args: Vec<String> = env::args().collect();
    
    // Support NODE_APP_INSTANCE environment variable from TSPM
    let base_port_str = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let base_port: u16 = base_port_str.parse().unwrap_or(8080);
    
    let instance_offset_str = env::var("NODE_APP_INSTANCE").unwrap_or_else(|_| "0".to_string());
    let instance_offset: u16 = instance_offset_str.parse().unwrap_or(0);
    
    let port = base_port + instance_offset;
    
    println!("Rust app starting on port {} (base={}, instance={})", port, base_port, instance_offset);

    thread::sleep(Duration::from_millis(200));

    let listener = TcpListener::bind(format!("0.0.0.0:{}", port));
    
    match listener {
        Ok(l) => {
            println!("Server process PID: {}", process::id());
            
            for stream in l.incoming() {
                match stream {
                    Ok(mut stream) => {
                        let mut buffer = [0; 1024];
                        stream.read(&mut buffer).unwrap();
                        let request = String::from_utf8_lossy(&buffer);
                        
                        // Default response
                        let response = format!("HTTP/1.1 200 OK\r\n\r\nHello from Rust instance {}!", instance_offset);
                        stream.write(response.as_bytes()).unwrap();
                        stream.flush().unwrap();
                        
                        // Only crash if enabled AND specifically requested via /crash path
                        if env::var("ENABLE_CRASH").unwrap_or_default() == "true" {
                            if request.contains("GET /crash") {
                                println!("⚠️  Received CRASH command for instance {}!", instance_offset);
                                thread::sleep(Duration::from_millis(100));
                                panic!("Intentional crash triggered via /crash endpoint!");
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Connection failed: {}", e);
                    }
                }
            }
        },
        Err(e) => {
            eprintln!("Failed to bind port {}: {}", port, e);
            process::exit(1);
        }
    }
}
