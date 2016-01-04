/*********************************************************************
Title    : distance_sensor
		
Processor: Arduino Mega168/Mega328

IDE      : Arduino IDE 1.5.6r2 (win32)
                                           		                                                                                                                        
Date     : 2016-01-04

Author   : Jerry Lee

Other    : Under MIT Licence
		
	  Copy right : Jerry Lee 2015-2016
      
*********************************************************/

/********************************************************

Distance from 4cm - 50cm as 560(4cm) - 160(50cm)
530 - 200 recommended
Send L,M,H to get data, 
Other char will return Middle accuracy.
Read Circuit diagram in the same folder before use.

*********************************************************/

#define PIN_READ A0
//pin A0 as sampling pin 
#define DELAY_TIME 12
//delay 12 ms
#define MIN_VOL 155
//if data lower than 160, abandon data

char acrcy; //define accuracy
//int delay_time = 50;//delay 50 ms;
int sampling = 30;//sampling 30 times as standard

void setup() {
  Serial.begin(9600);     //使用9600的波特率进行串口通讯
  analogReference(EXTERNAL);  //connect 3v3 to AREF as standard votage
  Serial.println("OK!");
}

int getDistance(int times) {
  int sumVotage=0;
  int i = 0;
  int sampleDid=0;//total sampling times
  while(i < times) {
    sampleDid++;
    int tempGet = analogRead(PIN_READ);//sampling
    if(tempGet>MIN_VOL) { //collect effective data
      sumVotage += tempGet;
      i++;
    }
    if(sampleDid>2*times||sampleDid>120) {
      return 0;// when S/N lower than 1/2 or too much sampling
    }
    delay(DELAY_TIME);
  }
  return sumVotage/times;// return average data
}

void loop() {
  while(Serial.available()) {
    acrcy = Serial.read();
    switch(acrcy){
      case 'L': sampling = 15;break;//L for Low accuracy
      case 'M': sampling = 30;break;//M for Middle accuracy
      case 'H': sampling = 60;break;//H for High accuracy
    }
    int dis = getDistance(sampling);
    Serial.println(dis);
    delay(1000);
  }  
  //int V0 = analogRead(A0);
  //Serial.println(V0);
}


