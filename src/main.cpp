//API to read and send data to server from RFID reader
//and to show the response status via LEDs
//By - Yogender Singh
#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ctime>

const char* ssid = "Bisht-L";
const char* password = "y1@s1NgH#B15ht68";

const char* serverName = "http://192.168.1.12:3000";

const char* receiverID = "1002";

constexpr uint8_t RST_PIN = D3;     // Configurable, see typical pin layout above
constexpr uint8_t SS_PIN = D4;     // Configurable, see typical pin layout above
constexpr uint8_t OK_PIN = D0;
constexpr uint8_t MISS_PIN = D1;
constexpr uint8_t READY_PIN = D2; 

MFRC522 rfid(SS_PIN, RST_PIN); // Instance of the class
MFRC522::MIFARE_Key key;

String tag;

void setup() {
  Serial.begin(9600);

  pinMode(OK_PIN, OUTPUT);
  pinMode(MISS_PIN, OUTPUT);
  pinMode(READY_PIN,OUTPUT);

  WiFi.begin(ssid, password);
  Serial.println("Connecting");
  while(WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("Connnected to WiFi network with IP address:");
  Serial.println(WiFi.localIP());

  SPI.begin(); // Init SPI bus
  rfid.PCD_Init(); // Init MFRC522
}

void loop() {

  if(WiFi.status() != WL_CONNECTED){
    digitalWrite(READY_PIN,LOW);
    Serial.println("Connecting to WiFi");
    while(WiFi.status() != WL_CONNECTED){
      delay(500);
      Serial.print(".");
    }

    Serial.println();
    Serial.println("Connnected to WiFi network with IP address:");
    Serial.println(WiFi.localIP());
  } else {
    digitalWrite(READY_PIN, HIGH);

    if ( ! rfid.PICC_IsNewCardPresent())
      return;
    
    if (rfid.PICC_ReadCardSerial()) {

      for (byte i = 0; i < 4; i++) {
        tag += rfid.uid.uidByte[i];
      }
      Serial.println("Readed Sensor with UID:" + tag);

      if(WiFi.status() == WL_CONNECTED){
        WiFiClient client;
        HTTPClient http;
        http.begin(client, serverName);
        http.addHeader("Content-Type", "application/json");

        String httpRequestData = "{\"guardID\":\""+tag+"\",\"ReceiverID\":\""+receiverID+"\"}";
        Serial.println("Data Sent to Server:" + httpRequestData);

        digitalWrite(READY_PIN,LOW);

        int httpResponseCode = http.POST(httpRequestData);
        if(httpResponseCode == 200){
          Serial.print("HIT, Response Code:");
          Serial.print(httpResponseCode);
          Serial.println();
          digitalWrite(OK_PIN,HIGH);
          delay(2000);
          digitalWrite(OK_PIN,LOW);
        } else if(httpResponseCode == 406){
          Serial.print("MISS, Error Code:");
          Serial.print(httpResponseCode);
          Serial.println();
          digitalWrite(MISS_PIN, HIGH);
          delay(2000);
          digitalWrite(MISS_PIN,LOW);
        } else if(httpResponseCode == 404){
          Serial.print("Invalid Read, Error Code:");
          Serial.print(httpResponseCode);
          Serial.println();
          
          digitalWrite(OK_PIN, HIGH);
          digitalWrite(MISS_PIN, HIGH);
          digitalWrite(READY_PIN, HIGH);
          delay(3000);
          digitalWrite(OK_PIN, LOW);
          digitalWrite(MISS_PIN, LOW);
          digitalWrite(READY_PIN, LOW);          
        }
        http.end();
      }
      tag = "";
      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();
    }
  }
}